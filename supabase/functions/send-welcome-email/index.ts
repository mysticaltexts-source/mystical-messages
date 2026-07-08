import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const LOGIN_URL = "https://mysticaltexts.com";
const SUPPORT_EMAIL = "hello@mysticaltexts.com";

serve(async (req) => {
  try {
    const { first_name, email } = await req.json();

    const html = `
      <div style="font-family:'Georgia',serif;max-width:580px;margin:0 auto;padding:40px 24px;background:#fdf8f0;color:#3d3530;">

        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:28px;margin-bottom:4px;">✦ Mystical Messages</div>
          <div style="font-size:13px;color:#7a6e66;letter-spacing:0.05em;">mysticaltexts.com</div>
        </div>

        <p style="font-size:16px;line-height:1.8;">Hey ${first_name},</p>

        <p style="font-size:15px;line-height:1.8;">
          Welcome to Mystical Messages — your <strong>60-day free trial</strong> starts right now,
          and we're genuinely glad you're here.
        </p>

        <p style="font-size:15px;line-height:1.8;">
          Your trial gives you full <strong>Standard access</strong> for the next 60 days — the complete toolkit:
        </p>

        <ul style="font-size:15px;line-height:2;padding-left:20px;">
          <li>🎅 Santa Claus, 🧚 the Tooth Fairy, and 🐰 the Easter Bunny — all three, ready to go</li>
          <li>Oh-Crap!! buttons for those last-minute magic moments</li>
          <li>Scheduling, message history, and multiple child profiles</li>
        </ul>

        <div style="text-align:center;margin:28px 0;">
          <a href="${LOGIN_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
            Log In &amp; Start the Magic ✨
          </a>
        </div>

        <div style="background:#132233;border-radius:16px;padding:24px 28px;margin:28px 0;">
          <p style="color:#e8b96a;font-size:14px;font-weight:bold;margin:0 0 10px;letter-spacing:0.05em;text-transform:uppercase;">How to get started</p>
          <ol style="color:rgba(255,255,255,0.78);font-size:14px;line-height:1.9;margin:0;padding-left:18px;">
            <li>Log in at <a href="${LOGIN_URL}" style="color:#e8b96a;">${LOGIN_URL}</a></li>
            <li>Add a child profile (just a name and age — takes 30 seconds)</li>
            <li>Pick a character and send your first message</li>
            <li>Watch your child's face when the text arrives on your phone</li>
          </ol>
        </div>

        <p style="font-size:15px;line-height:1.8;">
          <strong>Your feedback matters:</strong> poke around, send a test message, try scheduling one.
          Then tell us honestly — what felt magical, what felt clunky, what's missing.
          Right now your input shapes everything.
        </p>

        <p style="font-size:15px;line-height:1.8;">Hit reply anytime — we read every message.</p>

        <div style="text-align:center;margin:32px 0;">
          <a href="${LOGIN_URL}" style="display:inline-block;background:#c9933a;color:#0d1b2a;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
            Go to My Account →
          </a>
        </div>

        <p style="font-size:15px;line-height:1.8;margin-top:32px;">
          ✨ Welcome to the magic.<br/>
          <span style="color:#7a6e66;">— The Mystical Messages team</span>
        </p>

        <div style="border-top:1px solid rgba(201,147,58,0.2);margin-top:40px;padding-top:20px;text-align:center;">
          <p style="font-size:12px;color:#7a6e66;margin:0 0 6px;">Questions? We're always here.</p>
          <a href="mailto:${SUPPORT_EMAIL}" style="color:#c9933a;font-size:13px;text-decoration:none;">${SUPPORT_EMAIL}</a>
          <p style="font-size:11px;color:#b0a89e;margin:12px 0 0;">Mystical Texts LLC · <a href="${LOGIN_URL}" style="color:#b0a89e;">${LOGIN_URL}</a></p>
        </div>

      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mystical Messages <hello@mysticaltexts.com>",
        to: [email],
        subject: "Your 60-day free trial starts now ✨",
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
