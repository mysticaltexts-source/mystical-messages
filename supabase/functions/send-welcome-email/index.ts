import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const { first_name, email } = await req.json();

    const html = `
      <div style="font-family:'Georgia',serif;max-width:580px;margin:0 auto;padding:40px 24px;background:#fdf8f0;color:#3d3530;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:28px;margin-bottom:8px;">✦ Mystical Messages</div>
        </div>

        <p style="font-size:16px;line-height:1.8;">Hey ${first_name},</p>

        <p style="font-size:15px;line-height:1.8;">
          Welcome to Mystical Messages — you're one of a handful of people getting early access,
          and we're genuinely glad you're here.
        </p>

        <p style="font-size:15px;line-height:1.8;">
          Your account is set up with <strong>Standard access</strong>, which means you've got the full toolkit:
        </p>

        <ul style="font-size:15px;line-height:2;padding-left:20px;">
          <li>🎅 Santa Claus, 🧚 the Tooth Fairy, and 🐰 the Easter Bunny — all three, ready to go</li>
          <li>Oh-Crap!! buttons for those last-minute magic moments</li>
          <li>Scheduling, message history, and multiple child profiles</li>
        </ul>

        <div style="background:#132233;border-radius:16px;padding:24px 28px;margin:28px 0;">
          <p style="color:#e8b96a;font-size:14px;font-weight:bold;margin:0 0 10px;letter-spacing:0.05em;text-transform:uppercase;">One thing to know before you dive in</p>
          <p style="color:rgba(255,255,255,0.78);font-size:14px;line-height:1.8;margin:0;">
            We're in prelaunch, which means our SMS delivery is pending a carrier approval — totally
            normal, just a waiting game. When you send a message, you'll see the confirmation and
            everything will look exactly as it should, but the actual text won't arrive on your phone
            just yet. The moment approval clears, SMS flips on automatically. You won't need to do a thing.
          </p>
        </div>

        <p style="font-size:15px;line-height:1.8;">
          <strong>What we'd love from you:</strong> poke around. Try composing a message, set up a
          child profile, explore the characters. Then tell us honestly — what felt magical, what felt
          clunky, what's missing. Your feedback right now is more valuable than anything.
        </p>

        <p style="font-size:15px;line-height:1.8;">Hit reply anytime. We read everything.</p>

        <p style="font-size:15px;line-height:1.8;margin-top:32px;">
          ✨ Welcome to the magic.<br/>
          <span style="color:#7a6e66;">— The Mystical Messages team</span>
        </p>

        <div style="border-top:1px solid rgba(201,147,58,0.2);margin-top:40px;padding-top:20px;text-align:center;">
          <a href="https://mysticaltexts.com" style="color:#c9933a;font-size:13px;text-decoration:none;">mysticaltexts.com</a>
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
        subject: "You're in. ✨ Here's what to do first.",
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
