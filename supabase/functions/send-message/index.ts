// ============================================================
//  MYSTICAL MESSAGES — EDGE FUNCTION 1
//  Function name: send-message
//  What it does: Sends an SMS from a character's Twilio number
//                to the parent's registered phone number
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {

  // ── CORS headers so your React app can call this function ──
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {

    // ── 1. Get the logged-in parent from their auth token ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 401, headers }
      );
    }

    // ── 2. Connect to Supabase ──
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // ── 3. Verify the parent's identity ──
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers }
      );
    }

    // ── 4. Read the request body ──
    // Your React app will send these three things:
    // character_id — which character is sending the message
    // body         — the message text
    // child_id     — which child it is for (used to personalize)
    // is_ohcrap    — true if sent via Oh-Crap button
    const { character_id, body, child_id, is_ohcrap = false } = await req.json();

    if (!character_id || !body) {
      return new Response(
        JSON.stringify({ error: "character_id and body are required" }),
        { status: 400, headers }
      );
    }

    // ── 5. Load the parent's profile (we need their phone number) ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone_number, plan, trial_ends_at, trial_plan")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers }
      );
    }

    if (!profile.phone_number) {
      return new Response(
        JSON.stringify({ error: "No phone number on file. Please add your phone number in settings." }),
        { status: 400, headers }
      );
    }

    // ── 6. Load the character (we need their Twilio sender number) ──
    const { data: character, error: charError } = await supabase
      .from("characters")
      .select("name, emoji, twilio_number, required_plan")
      .eq("id", character_id)
      .single();

    if (charError || !character) {
      return new Response(
        JSON.stringify({ error: "Character not found" }),
        { status: 404, headers }
      );
    }

    // ── 7. Check the parent has the right plan to use this character ──
    const planRank = { free: 0, trial: 1, basic: 2, standard: 3, premium: 4 };

    // Trial-aware effective plan (mirrors the client's getEffectivePlan).
    // A trial is stored as trial_ends_at + trial_plan while plan stays "free".
    // A paid plan always wins; an active trial grants its level; otherwise free.
    const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const effectivePlan =
      (profile.plan && profile.plan !== "free") ? profile.plan
      : trialActive ? (profile.trial_plan || "standard")
      : "free";

    // Expired trial (or never started) → no sending, even for a scheduled job.
    if (effectivePlan === "free") {
      return new Response(
        JSON.stringify({ error: "Your free trial has ended. Choose a plan to keep sending magic." }),
        { status: 403, headers }
      );
    }

    const parentRank = planRank[effectivePlan] ?? 0;
    const requiredRank = planRank[character.required_plan] ?? 0;

    if (parentRank < requiredRank) {
      return new Response(
        JSON.stringify({ error: "Your current plan does not include this character. Please upgrade." }),
        { status: 403, headers }
      );
    }

    // ── 8. Send the SMS via Twilio ──
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken  = Deno.env.get("TWILIO_AUTH_TOKEN");

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: character.twilio_number,   // e.g. Santa's dedicated number
          To:   profile.phone_number,      // the parent's own phone — always
          Body: body,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      // Log the failure in the messages table
      await supabase.from("messages").insert({
        parent_id:    user.id,
        child_id:     child_id || null,
        character_id: character_id,
        body:         body,
        status:       "failed",
        is_ohcrap:    is_ohcrap,
        error_message: twilioData.message || "Twilio error",
      });

      return new Response(
        JSON.stringify({ error: "Failed to send SMS", detail: twilioData.message }),
        { status: 500, headers }
      );
    }

    // ── 9. Log the successful message in Supabase ──
    const { data: message } = await supabase.from("messages").insert({
      parent_id:    user.id,
      child_id:     child_id || null,
      character_id: character_id,
      body:         body,
      status:       "sent",
      is_ohcrap:    is_ohcrap,
      sent_at:      new Date().toISOString(),
      twilio_sid:   twilioData.sid,
    }).select().single();

    // ── 10. Return success ──
    return new Response(
      JSON.stringify({
        success: true,
        message_id: message?.id,
        twilio_sid: twilioData.sid,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
});