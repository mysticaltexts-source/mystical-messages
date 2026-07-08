import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const LOGIN_URL     = "https://mysticaltexts.com";
const BILLING_URL   = "https://mysticaltexts.com"; // routes to billing screen after login
const SUPPORT_EMAIL = "hello@mysticaltexts.com";

function buildEmail(firstName: string, referralLink: string): string {
  return `
  <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#fdf8f0;color:#3d3530;">

    <!-- HEADER -->
    <div style="background:#0d1b2a;padding:40px 32px 32px;text-align:center;border-radius:16px 16px 0 0;">
      <div style="font-size:40px;margin-bottom:12px;">🎉</div>
      <div style="font-family:'Georgia',serif;font-size:26px;font-weight:bold;color:#fdf8f0;line-height:1.3;">
        The Wait Is Over —<br/>Mystical Messages Is Live.
      </div>
      <div style="margin-top:16px;font-size:15px;color:rgba(255,255,255,0.65);font-style:italic;">
        And Earlybirds get first crack at everything.
      </div>
      <a href="${LOGIN_URL}" style="display:inline-block;margin-top:28px;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
        Log In &amp; Start the Magic ✨
      </a>
    </div>

    <!-- BODY -->
    <div style="padding:36px 32px;">

      <p style="font-size:16px;line-height:1.8;">Hey ${firstName},</p>

      <p style="font-size:15px;line-height:1.8;">
        SMS is on. Messages are flying. The magic is officially, actually, finally <strong>real</strong> —
        and you're one of the first people on earth to use it.
      </p>

      <p style="font-size:15px;line-height:1.8;">
        As an Earlybird, you earned something nobody else gets:
      </p>

      <!-- EARLYBIRD PERK BOX -->
      <div style="background:#132233;border-radius:16px;padding:28px 28px;margin:24px 0;border:1.5px solid rgba(201,147,58,0.3);">
        <div style="color:#e8b96a;font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px;">🐦 Your Earlybird Access</div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 10px;">
          <strong style="color:#fdf8f0;">60 days of full Standard access — on us.</strong><br/>
          All three characters. Oh-Crap!! Buttons. Scheduling. Message history.
          Multiple child profiles. The full toolkit, free, from today.
        </p>
        <p style="color:rgba(255,255,255,0.55);font-size:13px;margin:0;font-style:italic;">
          No credit card needed until your 60 days are up.
        </p>
      </div>

      <p style="font-size:15px;line-height:1.8;">
        But here's where it gets even better. You can <strong>extend your free time</strong> — and even
        unlock Premium — just by doing things that take a few minutes.
      </p>

      <!-- REVIEW REWARDS -->
      <div style="margin:28px 0;">
        <div style="font-family:'Georgia',serif;font-size:18px;font-weight:bold;color:#3d3530;margin-bottom:6px;">✍️ Earn Free Months with Reviews</div>
        <p style="font-size:14px;color:#7a6e66;margin:0 0 16px;line-height:1.6;">
          Honest reviews help other parents find the magic. We reward each one — and the more useful
          it is for other families to discover us, the more time you earn.
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f5ede0;">
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#3d3530;border-radius:8px 0 0 0;">Quick star rating</td>
            <td style="padding:12px 16px;font-size:13px;color:#7a6e66;">Google or Facebook ★★★★★</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#c9933a;text-align:right;border-radius:0 8px 0 0;">+ 2 weeks free</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#3d3530;">Written review</td>
            <td style="padding:12px 16px;font-size:13px;color:#7a6e66;">75+ words on Google or Facebook</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#c9933a;text-align:right;">+ 1 month free</td>
          </tr>
          <tr style="background:#f5ede0;">
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#3d3530;">Photo story</td>
            <td style="padding:12px 16px;font-size:13px;color:#7a6e66;">Review with a photo, or share on social media</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#c9933a;text-align:right;">+ 6 weeks free</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#3d3530;border-radius:0 0 0 8px;">Video testimonial</td>
            <td style="padding:12px 16px;font-size:13px;color:#7a6e66;">Short video review — your face, your story</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:bold;color:#c9933a;text-align:right;border-radius:0 0 8px 0;">+ 3 months free</td>
          </tr>
        </table>
        <p style="font-size:13px;color:#7a6e66;margin:10px 0 0;font-style:italic;">
          To claim: just email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#c9933a;">${SUPPORT_EMAIL}</a> with a link to your review and we'll add the time to your account.
        </p>
      </div>

      <!-- REFERRALS -->
      <div style="background:#f5ede0;border-radius:16px;padding:24px 28px;margin:28px 0;border:1px solid rgba(201,147,58,0.2);">
        <div style="font-family:'Georgia',serif;font-size:18px;font-weight:bold;color:#3d3530;margin-bottom:10px;">👨‍👩‍👧 Refer a Family, Earn Free Time</div>
        <p style="font-size:14px;line-height:1.8;color:#3d3530;margin:0 0 10px;">
          Every time someone subscribes through your personal referral link, you automatically
          earn a credit equal to <strong>one month of your current plan</strong> — applied straight
          to your account, no cap, stacks as long as you keep referring.
        </p>
        <p style="font-size:14px;line-height:1.8;color:#3d3530;margin:0 0 14px;">
          Share the link below. When a friend signs up through it and pays for the first time,
          the credit lands automatically — no forms, no emails to us.
        </p>
        <div style="background:#0d1b2a;border-radius:10px;padding:14px 18px;margin-bottom:6px;">
          <div style="font-family:'Arial',sans-serif;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em;">Your referral link</div>
          <div style="font-family:'Arial',sans-serif;font-size:13px;color:#e8b96a;word-break:break-all;">${referralLink}</div>
        </div>
        <p style="font-size:12px;color:#7a6e66;margin:8px 0 0;font-style:italic;">
          The link must be used at signup — credits aren't applied retroactively.
        </p>
      </div>

      <!-- EXCLUSIVITY -->
      <div style="border-left:3px solid #c9933a;padding:14px 20px;margin:28px 0;background:rgba(201,147,58,0.06);border-radius:0 8px 8px 0;">
        <p style="font-size:14px;line-height:1.8;color:#3d3530;margin:0;">
          <strong>This is for Earlybirds only.</strong> These rewards — the 60 free days, the review
          bonuses, the referral-to-Premium path — are not available to anyone who joins after launch.
          You earned them by believing in us early. We don't forget that.
        </p>
      </div>

      <!-- GETTING STARTED -->
      <p style="font-size:15px;line-height:1.8;">
        Need a refresher on how everything works? Your welcome email has a full getting-started guide —
        check your inbox for <strong>"You're in. ✨ Here's what to do first."</strong> Or just log in and
        start exploring — it's pretty intuitive once you're in.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${LOGIN_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
          Let's Go — Log In Now →
        </a>
      </div>

      <p style="font-size:15px;line-height:1.8;">
        Thank you for being here from the beginning. Seriously.
      </p>

      <p style="font-size:15px;line-height:1.8;margin-top:28px;">
        ✨ With so much gratitude,<br/>
        <span style="color:#7a6e66;">— The Mystical Messages team</span>
      </p>

    </div>

    <!-- FOOTER -->
    <div style="background:#0d1b2a;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center;">
      <a href="${LOGIN_URL}" style="display:inline-block;margin-bottom:16px;background:transparent;color:#e8b96a;font-family:'Arial',sans-serif;font-size:13px;font-weight:bold;padding:10px 28px;border-radius:8px;text-decoration:none;border:1.5px solid rgba(201,147,58,0.4);">
        Log In to My Account
      </a>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 6px;">Questions or anything at all — we're here.</p>
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

    // Fetch all earlybird profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, plan, referral_code")
      .eq("is_earlybird", true);

    if (profilesError) throw new Error(profilesError.message);
    if (!profiles?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No earlybird users found" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results: { email: string; status: string }[] = [];

    for (const profile of profiles) {
      // Get email from auth.users via admin API
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
      const referralLink = profile.referral_code
        ? `https://mysticaltexts.com/?ref=${profile.referral_code}`
        : "https://mysticaltexts.com";
      const html = buildEmail(firstName, referralLink);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mystical Messages <hello@mysticaltexts.com>",
          to: [user.email],
          subject: "🎉 We're Live — Your Earlybird Perks Start Now",
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
