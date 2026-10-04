// ============================================================
//  MYSTICAL MESSAGES — EDGE FUNCTION
//  Function name: send-scheduled-messages
//  What it does: Sends messages saved with status 'scheduled' whose time
//                has arrived, then marks each one 'sent' or 'failed'.
//  Triggered by: pg_cron every minute (see supabase/scheduled_sender_cron.sql).
//                Protected by the shared CRON_SECRET header.
//  Safety rules:
//    - Rows are claimed atomically (scheduled → sending), so nothing sends twice.
//    - Failures are final; there are no automatic retries (a retry after an
//      unclear Twilio response could text a child twice).
//    - Re-checks the expired-trial block, character plan, phone number and
//      content filter at send time.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CRON_SECRET = Deno.env.get("CRON_SECRET");

const BATCH_SIZE        = 50;
const MISSED_AFTER_MS   = 6 * 60 * 60 * 1000;  // older than 6h → "missed", not sent
const STUCK_AFTER_MS    = 10 * 60 * 1000;      // 'sending' for 10+ min → interrupted

// Keep in sync with FLAGGED_TERMS in src/App.jsx.
const FLAGGED_TERMS = [
  "fuck","fucking","shit","bitch","bastard","ass","asshole","dick","cock","pussy","cunt","whore","slut",
  "sex","sexy","nude","naked","porn",
  "rape","kill yourself","kys","suicide",
  "drugs","cocaine","meth","heroin","weed","marijuana","alcohol","beer","wine","vodka",
  "gun","weapon","bomb","terrorist","violence","abuse","molest","predator",
];

function screenMessage(text: string): string | null {
  const lower = text.toLowerCase();
  const hit = FLAGGED_TERMS.find((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(lower);
  });
  return hit ? `"${hit}" isn't something a magical character can say` : null;
}

const planRank: Record<string, number> = { free: 0, trial: 1, basic: 2, standard: 3, premium: 4 };

// Same logic as send-message: a paid plan wins, an active trial counts, else free.
function effectivePlan(profile: any): string {
  const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  return (profile.plan && profile.plan !== "free") ? profile.plan
    : trialActive ? (profile.trial_plan || "standard")
    : "free";
}

serve(async (req) => {
  // ── Auth: shared secret, so only our cron can trigger this ──
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const twilioSid   = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    // ── 0. Clean up runs that died mid-send. Marked failed, never retried. ──
    await supabase.from("messages")
      .update({ status: "failed", error_message: "Sending was interrupted; delivery unknown. Not retried." })
      .eq("status", "sending")
      .lt("sending_started_at", new Date(Date.now() - STUCK_AFTER_MS).toISOString());

    // ── 1. Claim due messages (atomic: scheduled → sending) ──
    const { data: claimed, error: claimError } = await supabase.rpc("claim_due_messages", { batch: BATCH_SIZE });
    if (claimError) {
      return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
    }

    const fail = async (id: string, reason: string, extra: Record<string, unknown> = {}) => {
      await supabase.from("messages")
        .update({ status: "failed", error_message: reason, ...extra })
        .eq("id", id);
    };

    const profiles = new Map<string, any>();
    const characters = new Map<string, any>();
    let sent = 0, failed = 0;

    for (const msg of claimed ?? []) {
      try {
        // ── 2. Too late? Don't text about Santa on the wrong day. ──
        if (Date.now() - new Date(msg.scheduled_for).getTime() > MISSED_AFTER_MS) {
          await fail(msg.id, "Missed: the scheduled time passed more than 6 hours before it could be sent.");
          failed++; continue;
        }

        // ── 3. Content filter (re-checked at send time) ──
        const flagReason = screenMessage(msg.body || "");
        if (flagReason) {
          await fail(msg.id, `Blocked: ${flagReason}.`, { flagged: true, flagged_reason: flagReason });
          failed++; continue;
        }

        // ── 4. Parent profile (cached per run) ──
        if (!profiles.has(msg.parent_id)) {
          const { data } = await supabase.from("profiles")
            .select("phone_number, plan, trial_ends_at, trial_plan")
            .eq("id", msg.parent_id).single();
          profiles.set(msg.parent_id, data);
        }
        const profile = profiles.get(msg.parent_id);
        if (!profile) { await fail(msg.id, "Profile not found."); failed++; continue; }

        // ── 5. Expired-trial block (trial can end between scheduling and sending) ──
        const plan = effectivePlan(profile);
        if (plan === "free") {
          await fail(msg.id, "Your free trial has ended. Choose a plan to keep sending magic.");
          failed++; continue;
        }

        if (!profile.phone_number) { await fail(msg.id, "No phone number on file."); failed++; continue; }

        // ── 6. Character + plan level ──
        if (!characters.has(msg.character_id)) {
          const { data } = await supabase.from("characters")
            .select("twilio_number, required_plan")
            .eq("id", msg.character_id).single();
          characters.set(msg.character_id, data);
        }
        const character = characters.get(msg.character_id);
        if (!character) { await fail(msg.id, "Character not found."); failed++; continue; }

        if ((planRank[plan] ?? 0) < (planRank[character.required_plan] ?? 0)) {
          await fail(msg.id, "Your current plan does not include this character.");
          failed++; continue;
        }

        // ── 7. Send via Twilio ──
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: character.twilio_number,
              To:   profile.phone_number,   // the parent's own phone — always
              Body: msg.body,
            }),
          },
        );
        const twilioData = await twilioRes.json();

        if (!twilioRes.ok) {
          await fail(msg.id, twilioData.message || "Twilio error");
          failed++; continue;
        }

        // ── 8. Mark the same row as sent ──
        await supabase.from("messages")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            twilio_sid: twilioData.sid,
            error_message: null,
          })
          .eq("id", msg.id);
        sent++;
      } catch (err) {
        // Unknown outcome (e.g. network drop mid-send). Final, not retried.
        await fail(msg.id, `Unexpected error; delivery unknown: ${(err as Error).message}`);
        failed++;
      }
    }

    return new Response(JSON.stringify({ claimed: claimed?.length ?? 0, sent, failed }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
