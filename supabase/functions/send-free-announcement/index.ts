import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const LOGIN_URL     = "https://mysticaltexts.com";
const BILLING_URL   = "https://mysticaltexts.com"; // directs to billing screen after login
const SUPPORT_EMAIL = "hello@mysticaltexts.com";

function buildEmail(firstName: string): string {
  return `
  <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#fdf8f0;color:#3d3530;">

    <!-- HEADER -->
    <div style="background:#0d1b2a;padding:40px 32px 32px;text-align:center;border-radius:16px 16px 0 0;">
      <div style="font-size:40px;margin-bottom:12px;">✨</div>
      <div style="font-family:'Georgia',serif;font-size:26px;font-weight:bold;color:#fdf8f0;line-height:1.3;">
        The Magic Is Real —<br/>We're Officially Live.
      </div>
      <div style="margin-top:14px;font-size:15px;color:rgba(255,255,255,0.65);font-style:italic;">
        Your account has been waiting. It's ready for you right now.
      </div>
      <a href="${LOGIN_URL}" style="display:inline-block;margin-top:28px;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
        Log In &amp; See for Yourself ✨
      </a>
    </div>

    <!-- BODY -->
    <div style="padding:36px 32px;">

      <p style="font-size:16px;line-height:1.8;">Hey ${firstName},</p>

      <p style="font-size:15px;line-height:1.8;">
        We've been working on something that makes childhood just a little more magical —
        and today it's live and in the wild. Real SMS messages from Santa, the Tooth Fairy,
        and the Easter Bunny, delivered straight to your phone to share with your kids at
        exactly the right moment.
      </p>

      <p style="font-size:15px;line-height:1.8;">
        You already have an account with us. That means you're one step ahead —
        <strong>no signup needed.</strong> Just log in and the magic is waiting.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${LOGIN_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
          Log In to My Account →
        </a>
      </div>

      <!-- WHAT'S FREE -->
      <div style="background:#f5ede0;border-radius:16px;padding:24px 28px;margin:24px 0;border:1px solid rgba(201,147,58,0.2);">
        <div style="font-family:'Georgia',serif;font-size:16px;font-weight:bold;color:#3d3530;margin-bottom:10px;">What's included on a free account</div>
        <ul style="font-size:14px;line-height:2;color:#3d3530;padding-left:18px;margin:0 0 14px;">
          <li>One free message — pick any character you like</li>
          <li>Santa Claus, the Tooth Fairy, or the Easter Bunny</li>
          <li>One child profile</li>
        </ul>
        <p style="font-size:14px;color:#7a6e66;margin:0;line-height:1.7;">
          Ready to unlock all three characters, Oh-Crap!! Buttons, scheduling, and more?
          Plans start at <strong>$4.99/month</strong> — less than a coffee.
        </p>
      </div>

      <!-- UPGRADE NUDGE -->
      <div style="background:#132233;border-radius:16px;padding:24px 28px;margin:24px 0;border:1.5px solid rgba(201,147,58,0.25);">
        <div style="color:#e8b96a;font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">✦ Most Popular</div>
        <div style="color:#fdf8f0;font-size:16px;font-weight:bold;margin-bottom:8px;">Standard — $9.99/month</div>
        <ul style="color:rgba(255,255,255,0.78);font-size:14px;line-height:1.9;padding-left:18px;margin:0 0 16px;">
          <li>All three characters — Santa, Tooth Fairy, Easter Bunny</li>
          <li>Oh-Crap!! Buttons (magic in one tap, even at 11pm)</li>
          <li>30+ templates written to feel genuinely magical</li>
          <li>Scheduling, message history, multiple children</li>
        </ul>
        <a href="${BILLING_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:13px;font-weight:bold;padding:11px 28px;border-radius:8px;text-decoration:none;">
          See All Plans →
        </a>
      </div>

      <!-- GETTING STARTED -->
      <p style="font-size:15px;line-height:1.8;">
        Not sure where to start? Check your inbox for an earlier email from us —
        <strong>"You're in. ✨ Here's what to do first."</strong> — it has everything you need
        to hit the ground running. Or just log in and follow the prompts; it only takes a minute.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${LOGIN_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
          Let's Make Some Magic →
        </a>
      </div>

      <p style="font-size:15px;line-height:1.8;">
        Questions? Just hit reply — we actually read them all.
      </p>

      <p style="font-size:15px;line-height:1.8;margin-top:28px;">
        ✨ Can't wait to see the magic you make,<br/>
        <span style="color:#7a6e66;">— The Mystical Messages team</span>
      </p>

    </div>

    <!-- FOOTER -->
    <div style="background:#0d1b2a;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center;">
      <a href="${LOGIN_URL}" style="display:inline-block;margin-bottom:16px;background:transparent;color:#e8b96a;font-family:'Arial',sans-serif;font-size:13px;font-weight:bold;padding:10px 28px;border-radius:8px;text-decoration:none;border:1.5px solid rgba(201,147,58,0.4);">
        Log In to My Account
      </a>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 6px;">Questions? We're always here for you.</p>
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#e8b96a;font-size:13px;text-decoration:none;">${SUPPORT_EMAIL}</a>
      <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:16px 0 0;">Mystical Texts LLC · <a href="${LOGIN_URL}" style="color:rgba(255,255,255,0.25);">${LOGIN_URL}</a></p>
    </div>

  </div>
  `;
}

serve(async (req) => {
  try {
    const { dry_run = false } = await req.json().catch(() => ({}));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch all free-plan profiles (registered but never upgraded or redeemed a code)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, plan")
      .or("plan.eq.free,plan.is.null");

    if (profilesError) throw new Error(profilesError.message);
    if (!profiles?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No free-plan users found" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results: { email: string; status: string }[] = [];

    for (const profile of profiles) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
      if (userError || !user?.email) {
        results.push({ email: profile.id, status: "skipped — no email" });
        continue;
      }

      if (dry_run) {
        results.push({ email: user.email, status: "dry_run" });
        continue;
      }

      const firstName = (profile.full_name || user.email).split(" ")[0];
      const html = buildEmail(firstName);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mystical Messages <hello@mysticaltexts.com>",
          to: [user.email],
          subject: "✨ We're Live — Your Account Is Ready for Magic",
          html,
        }),
      });

      results.push({ email: user.email, status: res.ok ? "sent" : `failed (${res.status})` });
    }

    return new Response(JSON.stringify({ sent: results.filter(r => r.status === "sent").length, total: results.length, results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
