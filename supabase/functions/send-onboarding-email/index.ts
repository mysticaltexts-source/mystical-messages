import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY");
const APP_URL         = "https://mysticaltexts.com";
const SUPPORT_EMAIL   = "hello@mysticaltexts.com";
const FACEBOOK_GROUP  = "https://www.facebook.com/share/g/1JA1xM9zaT/?mibextid=wwXIfr";

const divider = `<div style="height:1px;background:rgba(201,147,58,0.15);margin:0 0 28px;"></div>`;

function badge(n: string): string {
  return `<div style="display:inline-block;width:32px;height:32px;background:#c9933a;border-radius:50%;text-align:center;line-height:32px;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;color:#0d1b2a;vertical-align:middle;margin-right:10px;">${n}</div>`;
}

function buildEmail(firstName: string, referralLink: string): string {
  return `
  <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#0d1b2a;color:#fdf8f0;">

    <!-- HEADER -->
    <div style="padding:44px 32px 28px;text-align:center;border-bottom:1px solid rgba(201,147,58,0.15);">
      <div style="font-size:32px;margin-bottom:12px;">✨</div>
      <div style="font-family:'Georgia',serif;font-size:26px;font-weight:bold;color:#fdf8f0;line-height:1.3;margin-bottom:10px;">
        Get started with Mystical Messages
      </div>
      <div style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
        Hey ${firstName} — you're all set. Here's how to make some magic.
      </div>
    </div>

    <!-- STEPS -->
    <div style="padding:36px 32px;">

      <!-- 1. Send your free message -->
      <div style="margin-bottom:28px;">
        <div style="margin-bottom:10px;">
          ${badge("1")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Send your first free message</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Your free message is waiting. Pick Santa, the Tooth Fairy, or the Easter Bunny — write something that'll make their eyes go wide.
        </p>
        <div style="background:#c9933a;border-radius:14px;padding:18px 20px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.96);border-radius:10px;padding:16px 18px;">
            <div style="font-family:'Arial',sans-serif;font-size:11px;font-weight:bold;color:#7a6e66;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Choose a character</div>
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="33%" style="padding-right:5px;">
                <div style="background:#0d1b2a;border-radius:8px;padding:10px 6px;text-align:center;font-family:'Arial',sans-serif;font-size:12px;color:#e8b96a;">🎅<br/>Santa</div>
              </td>
              <td width="33%" style="padding:0 3px;">
                <div style="background:#f5ede0;border-radius:8px;padding:10px 6px;text-align:center;font-family:'Arial',sans-serif;font-size:12px;color:#3d3530;">🧚<br/>Tooth Fairy</div>
              </td>
              <td width="33%" style="padding-left:5px;">
                <div style="background:#f5ede0;border-radius:8px;padding:10px 6px;text-align:center;font-family:'Arial',sans-serif;font-size:12px;color:#3d3530;">🐰<br/>Easter Bunny</div>
              </td>
            </tr></table>
          </div>
        </div>
        <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          Send a free message →
        </a>
      </div>

      ${divider}

      <!-- 2. Join the Facebook group -->
      <div style="margin-bottom:28px;">
        <div style="margin-bottom:10px;">
          ${badge("2")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Join our members-only Facebook group</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Connect with other parents keeping the magic alive. Share your moments, get tips, and be the first to hear about new features and characters.
        </p>
        <div style="background:#1877f2;border-radius:14px;padding:18px 20px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.96);border-radius:10px;padding:16px 18px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">👨‍👩‍👧‍👦</div>
            <div style="font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;color:#1c1e21;margin-bottom:4px;">Mystical Messages Community</div>
            <div style="font-family:'Arial',sans-serif;font-size:12px;color:#65676b;">Private group · Members only</div>
          </div>
        </div>
        <a href="${FACEBOOK_GROUP}" style="display:inline-block;background:#1877f2;color:#ffffff;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          Join the group →
        </a>
      </div>

      ${divider}

      <!-- 3. Schedule magic in advance -->
      <div style="margin-bottom:28px;">
        <div style="margin-bottom:10px;">
          ${badge("3")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Schedule magic in advance</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Christmas Eve at midnight. The morning after a tooth falls out. Set up messages ahead of time so the magic never misses its moment.
        </p>
        <div style="background:#4a8c6e;border-radius:14px;padding:18px 20px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.96);border-radius:10px;padding:16px 18px;">
            <div style="font-family:'Arial',sans-serif;font-size:11px;font-weight:bold;color:#7a6e66;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Scheduled message</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:'Arial',sans-serif;font-size:13px;color:#2c1e0f;padding-bottom:4px;">🎅 Santa Claus</td></tr>
              <tr><td style="font-family:'Arial',sans-serif;font-size:12px;color:#7a6e66;padding-bottom:8px;">📅 December 24 · 11:59 PM</td></tr>
              <tr><td>
                <div style="background:#0d1b2a;border-radius:6px;padding:8px 12px;font-family:'Arial',sans-serif;font-size:12px;color:#e8b96a;">"I know you've been so good this year…"</div>
              </td></tr>
            </table>
          </div>
        </div>
        <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          Schedule a message →
        </a>
      </div>

      ${divider}

      <!-- 4. Verify account info -->
      <div style="margin-bottom:28px;">
        <div style="margin-bottom:10px;">
          ${badge("4")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Verify your account info</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Make sure your phone number and name are correct so every message lands exactly right.
        </p>
        <div style="background:#7a6e66;border-radius:14px;padding:18px 20px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.96);border-radius:10px;padding:16px 18px;">
            <div style="font-family:'Arial',sans-serif;font-size:11px;font-weight:bold;color:#7a6e66;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">My Account</div>
            <p style="font-family:'Arial',sans-serif;font-size:13px;color:#7a6e66;margin:0 0 4px;">Questions? Email us at</p>
            <a href="mailto:${SUPPORT_EMAIL}" style="font-family:'Arial',sans-serif;font-size:13px;color:#c9933a;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </div>
        </div>
        <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          Check my settings →
        </a>
      </div>

      ${divider}

      <!-- 5. Select a plan -->
      <div style="margin-bottom:28px;">
        <div style="margin-bottom:10px;">
          ${badge("5")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Pick the right plan</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Unlock all three characters, Oh-Crap!! Buttons, message history, and more. Plans start at $1.99/month — less than a birthday candle.
        </p>
        <div style="background:#132233;border-radius:14px;padding:18px 20px;margin-bottom:16px;border:1.5px solid rgba(201,147,58,0.3);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="50%" style="padding-right:6px;">
              <div style="background:#0d1b2a;border-radius:8px;padding:14px;border:1.5px solid rgba(201,147,58,0.4);">
                <div style="font-family:'Arial',sans-serif;font-size:10px;color:#e8b96a;font-weight:bold;letter-spacing:0.08em;margin-bottom:4px;">STANDARD ✦</div>
                <div style="font-family:'Arial',sans-serif;font-size:18px;font-weight:bold;color:#fdf8f0;">$4.99<span style="font-size:11px;font-weight:normal;color:rgba(255,255,255,0.45)">/mo</span></div>
                <div style="font-family:'Arial',sans-serif;font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">Best value</div>
              </div>
            </td>
            <td width="50%" style="padding-left:6px;">
              <div style="background:#0d1b2a;border-radius:8px;padding:14px;border:1px solid rgba(201,147,58,0.12);">
                <div style="font-family:'Arial',sans-serif;font-size:10px;color:rgba(255,255,255,0.4);font-weight:bold;letter-spacing:0.08em;margin-bottom:4px;">BASIC</div>
                <div style="font-family:'Arial',sans-serif;font-size:18px;font-weight:bold;color:#fdf8f0;">$1.99<span style="font-size:11px;font-weight:normal;color:rgba(255,255,255,0.45)">/mo</span></div>
                <div style="font-family:'Arial',sans-serif;font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">Great starter</div>
              </div>
            </td>
          </tr></table>
        </div>
        <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          See all plans →
        </a>
      </div>

      ${divider}

      <!-- 6. Share the magic / referral -->
      <div style="margin-bottom:8px;">
        <div style="margin-bottom:10px;">
          ${badge("6")}
          <span style="font-family:'Arial',sans-serif;font-size:19px;font-weight:bold;color:#fdf8f0;vertical-align:middle;">Share the magic — earn rewards</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.8;margin:0 0 14px;padding-left:42px;">
          Give a friend an extended free trial. When they subscribe, you get a free month. Your personal link:
        </p>
        <div style="background:#4a3728;border-radius:14px;padding:18px 20px;margin-bottom:16px;border:1px solid rgba(201,147,58,0.25);">
          <div style="font-family:'Arial',sans-serif;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em;">Your referral link</div>
          <div style="font-family:'Arial',sans-serif;font-size:13px;color:#e8b96a;word-break:break-all;">${referralLink}</div>
        </div>
        <a href="${referralLink}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px;text-decoration:none;">
          Share the magic →
        </a>
      </div>

    </div>

    <!-- CLOSING -->
    <div style="background:#132233;padding:36px 32px;text-align:center;border-top:1px solid rgba(201,147,58,0.15);border-bottom:1px solid rgba(201,147,58,0.15);">
      <div style="font-size:36px;margin-bottom:14px;">✨</div>
      <div style="font-family:'Georgia',serif;font-size:22px;font-weight:bold;color:#fdf8f0;margin-bottom:12px;">Make Magic</div>
      <p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.8;margin:0 0 22px;">
        The stage is set. Your kids are waiting.<br/>Go make some memories.
      </p>
      <a href="${APP_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
        Log In &amp; Make Magic ✨
      </a>
    </div>

    <!-- FOOTER -->
    <div style="padding:24px 32px;text-align:center;">
      <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 8px;">Questions? We're always here for you.</p>
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#e8b96a;font-size:13px;text-decoration:none;">${SUPPORT_EMAIL}</a>
      <div style="margin-top:14px;">
        <a href="${APP_URL}/terms/" style="color:rgba(255,255,255,0.28);font-size:11px;text-decoration:none;margin:0 8px;">Terms</a>
        <a href="${APP_URL}/privacy/" style="color:rgba(255,255,255,0.28);font-size:11px;text-decoration:none;margin:0 8px;">Privacy</a>
        <a href="${APP_URL}/sms-consent/" style="color:rgba(255,255,255,0.28);font-size:11px;text-decoration:none;margin:0 8px;">SMS Consent</a>
      </div>
      <p style="font-size:11px;color:rgba(255,255,255,0.18);margin:12px 0 0;">
        Mystical Texts LLC · <a href="${APP_URL}" style="color:rgba(255,255,255,0.18);">${APP_URL}</a>
      </p>
    </div>

  </div>
  `;
}

serve(async (req) => {
  try {
    const { first_name, email, referral_link } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

    const name = first_name || email.split("@")[0];
    // referral_link is a placeholder until the referral system is built;
    // once referral_code exists on profiles, pass mysticaltexts.com/?ref=CODE here
    const link = referral_link || `${APP_URL}/?ref=COMING_SOON`;

    const html = buildEmail(name, link);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mystical Messages <hello@mysticaltexts.com>",
        to: [email],
        subject: `Get started with Mystical Messages, ${name} ✨`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: res.ok ? 200 : 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
