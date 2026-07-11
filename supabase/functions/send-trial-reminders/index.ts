// ============================================================
//  MYSTICAL MESSAGES — EDGE FUNCTION
//  Function name: send-trial-reminders
//  What it does: Emails users whose free trial ends within 2 days
//                (day-12 of the 14-day trial), once each, via Resend.
//  Triggered by: a daily GitHub Actions cron (see
//                .github/workflows/trial-reminders.yml). Protected by a
//                shared CRON_SECRET header so it can't be triggered publicly.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET     = Deno.env.get("CRON_SECRET");
const APP_URL         = "https://mysticaltexts.com";
const SUPPORT_EMAIL   = "hello@mysticaltexts.com";

function buildEmail(firstName: string): string {
  return `
  <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#0d1b2a;color:#fdf8f0;">
    <div style="padding:44px 32px 28px;text-align:center;border-bottom:1px solid rgba(201,147,58,0.15);">
      <div style="font-size:32px;margin-bottom:12px;">✨</div>
      <div style="font-size:26px;font-weight:bold;line-height:1.3;margin-bottom:10px;">Your magic pauses in 2 days</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">Hey ${firstName} — your free trial is almost up.</div>
    </div>
    <div style="padding:36px 32px;">
      <p style="font-size:15px;color:rgba(255,255,255,0.8);line-height:1.85;margin:0 0 20px;">
        Your free trial of Mystical Messages winds down in <strong style="color:#e8b96a;">2 days</strong>. After that, the magic gently pauses — but nothing disappears. Your account, your children's profiles, and your message history all stay right where you left them.
      </p>
      <p style="font-size:15px;color:rgba(255,255,255,0.8);line-height:1.85;margin:0 0 28px;">
        Keep the wonder going by choosing a plan — from <strong style="color:#e8b96a;">$1.99/mo</strong>, or send a single message for <strong style="color:#e8b96a;">$0.99</strong>. Cancel anytime.
      </p>
      <div style="text-align:center;">
        <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;">Choose your plan →</a>
      </div>
    </div>
    <div style="background:#132233;padding:28px 32px;text-align:center;border-top:1px solid rgba(201,147,58,0.15);">
      <p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.8;margin:0;">The stage is set. Your kids are waiting.</p>
    </div>
    <div style="padding:20px 32px;text-align:center;">
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#e8b96a;font-size:13px;text-decoration:none;">${SUPPORT_EMAIL}</a>
    </div>
  </div>
  `;
}

serve(async (req) => {
  // ── Auth: shared secret, so only our cron can trigger this ──
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: recipients, error } = await supabase.rpc("get_trial_reminder_recipients");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sent = 0, failed = 0;
    for (const r of recipients ?? []) {
      const firstName = (r.full_name || r.email?.split("@")[0] || "there").split(" ")[0];

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mystical Messages <hello@mysticaltexts.com>",
          to: [r.email],
          subject: `✨ Your magic pauses in 2 days, ${firstName}`,
          html: buildEmail(firstName),
        }),
      });

      if (res.ok) {
        // Mark only after a successful send, so a failure retries tomorrow.
        await supabase.from("profiles")
          .update({ trial_reminder_sent_at: new Date().toISOString() })
          .eq("id", r.id);
        sent++;
      } else {
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
