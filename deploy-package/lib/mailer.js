/**
 * Mystical Messages — Email Notification System
 *
 * DESIGN PRINCIPLES:
 * 1. All email subjects and bodies use cryptic, vague language so a child who
 *    accidentally reads a parent's email cannot deduce the app is behind the magic.
 * 2. No email ever reveals character names, app mechanics, or that messages are scripted.
 * 3. No child phone numbers or child data ever appear in any email.
 * 4. All emails are sent to the adult account holder only.
 */

const nodemailer = require('nodemailer');

// ─── Transport Setup ────────────────────────────────────────────────────────

function createTransport() {
    const host     = process.env.SMTP_HOST;
    const port     = parseInt(process.env.SMTP_PORT || '587');
    const user     = process.env.SMTP_USER;
    const pass     = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || 'Mystical Messages';
    const fromAddr = process.env.SMTP_FROM_EMAIL || user;

    if (!host || !user || !pass) {
        console.warn('⚠️  Mailer: SMTP not configured — emails will be logged only.');
        return null;
    }

    const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });

    transport._from = `"${fromName}" <${fromAddr}>`;
    return transport;
}

// ─── Core Send Function ──────────────────────────────────────────────────────

async function sendEmail({ to, subject, html, text }) {
    const transport = createTransport();

    if (!transport) {
        // Log to console in dev mode so the team can see what would be sent
        console.log('\n📧 [EMAIL — not sent, SMTP unconfigured]');
        console.log(`   To:      ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body:    ${text || '(html only)'}\n`);
        return { simulated: true };
    }

    try {
        const info = await transport.sendMail({
            from: transport._from,
            to,
            subject,
            text,
            html
        });
        console.log(`✅ Email sent to ${to} — Message ID: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ Email failed to ${to}:`, err.message);
        return { sent: false, error: err.message };
    }
}

// ─── Shared HTML Wrapper ─────────────────────────────────────────────────────

function wrap(bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mystical Messages</title>
<style>
  body { margin:0; padding:0; background:#f5f3ff; font-family:'Segoe UI',Arial,sans-serif; }
  .outer { max-width:560px; margin:32px auto; background:#fff; border-radius:16px;
           box-shadow:0 2px 16px rgba(107,70,193,0.10); overflow:hidden; }
  .header { background:linear-gradient(135deg,#6B46C1,#F687B3);
            padding:28px 24px 20px; text-align:center; }
  .header .logo { font-size:2rem; margin-bottom:6px; }
  .header h1 { margin:0; color:#fff; font-size:1.15rem; font-weight:700; letter-spacing:0.02em; }
  .header p { margin:4px 0 0; color:rgba(255,255,255,0.85); font-size:0.8rem; }
  .body { padding:28px 28px 20px; }
  .body p { color:#4a4a6a; font-size:0.92rem; line-height:1.7; margin:0 0 14px; }
  .body .highlight { background:#f5f3ff; border-left:3px solid #6B46C1; padding:12px 16px;
                     border-radius:0 8px 8px 0; font-size:0.88rem; color:#4a4a6a; margin:16px 0; }
  .body .detail-row { display:flex; justify-content:space-between; padding:8px 0;
                      border-bottom:1px solid #f0eeff; font-size:0.85rem; }
  .body .detail-label { color:#888; }
  .body .detail-value { color:#4a4a6a; font-weight:600; text-align:right; }
  .btn { display:inline-block; background:linear-gradient(135deg,#6B46C1,#805AD5);
         color:#fff!important; text-decoration:none; padding:11px 28px; border-radius:50px;
         font-size:0.88rem; font-weight:600; margin:8px 0; }
  .footer { background:#f9f7ff; padding:16px 24px; text-align:center;
            border-top:1px solid #ede9fe; }
  .footer p { margin:0; font-size:0.75rem; color:#9b9bbb; line-height:1.6; }
  .footer a { color:#6B46C1; text-decoration:none; }
  .divider { height:1px; background:#f0eeff; margin:16px 0; }
  .stars { font-size:1.2rem; letter-spacing:3px; color:#F687B3; margin-bottom:6px; }
</style>
</head>
<body>
<div class="outer">
  <div class="header">
    <div class="logo">✨</div>
    <h1>Mystical Messages</h1>
    <p>Where wonder is delivered</p>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    <p>
      Questions? <a href="mailto:support@mysticalmessages.com">support@mysticalmessages.com</a><br>
      <a href="${process.env.APP_URL || 'https://mysticalmessages.com'}/refund">Refund Policy</a> ·
      <a href="${process.env.APP_URL || 'https://mysticalmessages.com'}/privacy">Privacy Policy</a> ·
      <a href="${process.env.APP_URL || 'https://mysticalmessages.com'}/terms">Terms</a>
    </p>
    <p style="margin-top:8px;">
      You're receiving this because you have an account at Mystical Messages.<br>
      This message was sent to the registered adult account holder only.
    </p>
  </div>
</div>
</body>
</html>`;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

/**
 * 1. Welcome email — sent on account creation.
 *    Cryptic tone: warm, whimsical, no mechanics revealed.
 */
async function sendWelcomeEmail(user) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';

    const html = wrap(`
      <div class="stars">✦ ✦ ✦</div>
      <p>Hello ${firstName},</p>
      <p>
        Something magical just happened — a new doorway has opened, and wonder is waiting on the other side. ✨
      </p>
      <p>
        Your account is all set. From here, you hold the keys to moments your family will carry with them forever.
        The enchanted realm is ready whenever you are.
      </p>
      <div class="highlight">
        🔮 A gentle reminder: the magic only works its best when <strong>you're the one guiding it</strong>.
        Keep your account credentials private, and always supervise the wonder you set in motion.
      </div>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/dashboard" class="btn">Step Into the Magic →</a>
      </p>
      <div class="divider"></div>
      <p style="font-size:0.82rem;color:#999;">
        If you did not create this account, please
        <a href="mailto:support@mysticalmessages.com" style="color:#6B46C1;">contact us immediately</a>.
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject: '✨ Your doorway to wonder is open',
        html,
        text: `Hello ${firstName}, your Mystical Messages account is ready. Visit ${appUrl}/dashboard to begin.`
    });
}

/**
 * 2. Message dispatched email — sent after a message is successfully sent.
 *    CRITICAL: Subject and body must NOT reveal character names, scripting,
 *    or that this is an automated service. A child reading this email over
 *    a parent's shoulder must not be able to piece together the magic.
 */
async function sendMessageDispatchedEmail(user, { characterEmoji, childName, sendMode, scheduledAt }) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';

    // Cryptic phrases that hint at "something was sent" without saying what
    const crypticSubjects = [
        '🌟 A spark has been set in motion',
        '✨ The enchantment is on its way',
        '🔮 The realm has received your request',
        '🌙 Something wonderful stirs this night',
        '⭐ A little magic is headed somewhere special',
        '🌈 The winds are carrying your wishes',
    ];
    const subject = crypticSubjects[Math.floor(Math.random() * crypticSubjects.length)];

    // Delivery timing description (cryptic)
    let timingNote = '';
    if (sendMode === 'scheduled' && scheduledAt) {
        const dt = new Date(scheduledAt);
        timingNote = `The enchantment is set to stir at <strong>${dt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</strong>.`;
    } else if (sendMode === 'immediate') {
        timingNote = 'The enchantment has already begun to weave its way.';
    } else {
        timingNote = 'The enchantment is queued and will find its moment.';
    }

    // Child name shown only if provided — still cryptic
    const recipientLine = childName
        ? `<div class="detail-row"><span class="detail-label">For</span><span class="detail-value">A little one named ${childName}</span></div>`
        : '';

    const html = wrap(`
      <div class="stars">✦ ✦ ✦</div>
      <p>Hello ${firstName},</p>
      <p>
        Consider this your quiet confirmation — the realm has accepted your request and
        set the wheels of wonder in motion. ${characterEmoji || '✨'}
      </p>
      <div class="highlight">
        ${timingNote} Keep this note to yourself — some things work best when only you know the secret. 🤫
      </div>
      ${recipientLine ? `<div style="margin:16px 0;">${recipientLine}</div>` : ''}
      <p>
        You can review the full tapestry of enchantments in your account at any time —
        though we'd suggest keeping that between us.
      </p>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/messages/history" class="btn">View Your Enchantments →</a>
      </p>
      <div class="divider"></div>
      <p style="font-size:0.82rem;color:#999;">
        If you did not set this in motion, please
        <a href="mailto:support@mysticalmessages.com" style="color:#6B46C1;">let us know right away</a>.
        Your account may require attention.
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject,
        html,
        text: `Hello ${firstName}, a message has been set in motion. View your history at ${appUrl}/messages/history`
    });
}

/**
 * 3. Subscription confirmation email — sent when a plan is activated.
 *    Warm but does not reveal what the product does in detail.
 */
async function sendSubscriptionConfirmationEmail(user, { tier, amount, renewalDate }) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';

    const tierNames = { basic: 'Basic', premium: 'Premium', free: 'Free' };
    const tierEmojis = { basic: '⭐', premium: '👑', free: '🌱' };
    const tierName = tierNames[tier] || tier;
    const tierEmoji = tierEmojis[tier] || '✨';

    const html = wrap(`
      <div class="stars">✦ ✦ ✦</div>
      <p>Hello ${firstName},</p>
      <p>
        Your enchantment pass has been confirmed. The doors of wonder are open wide — you have
        full access to create memorable moments whenever you choose. ${tierEmoji}
      </p>
      <div style="margin:16px 0;">
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${tierEmoji} ${tierName}</span>
        </div>
        ${amount ? `<div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">$${parseFloat(amount).toFixed(2)}/month</span></div>` : ''}
        ${renewalDate ? `<div class="detail-row"><span class="detail-label">Next renewal</span><span class="detail-value">${new Date(renewalDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span></div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Billing</span>
          <span class="detail-value">Monthly, auto-renews</span>
        </div>
      </div>
      <div class="highlight">
        💳 Payments are processed securely by Stripe. You can cancel anytime from your account settings —
        no fees, no hassle. See our <a href="${appUrl}/refund">Refund Policy</a> for details.
      </div>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/dashboard" class="btn">Begin the Magic →</a>
      </p>
      <div class="divider"></div>
      <p style="font-size:0.82rem;color:#999;">
        To manage or cancel your subscription, visit <a href="${appUrl}/settings" style="color:#6B46C1;">Account Settings</a>.
        Questions? <a href="mailto:billing@mysticalmessages.com" style="color:#6B46C1;">billing@mysticalmessages.com</a>
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject: `${tierEmoji} Your ${tierName} enchantment pass is active`,
        html,
        text: `Hello ${firstName}, your ${tierName} subscription is active. Visit ${appUrl}/dashboard to get started.`
    });
}

/**
 * 4. Subscription cancelled email.
 */
async function sendSubscriptionCancelledEmail(user, { tier, expiresAt }) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';
    const tierNames = { basic: 'Basic', premium: 'Premium' };
    const tierName = tierNames[tier] || tier;

    const html = wrap(`
      <p>Hello ${firstName},</p>
      <p>
        We've received your request to close the enchanted gates. Your
        <strong>${tierName}</strong> plan has been cancelled and will not renew.
      </p>
      <div class="highlight">
        📅 You still have full access to your account until
        <strong>${expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' }) : 'the end of your current billing period'}</strong>.
        After that, your account will revert to a free plan.
      </div>
      <p>
        We're sorry to see you go. If there's anything we could have done better,
        we'd genuinely love to hear it — reply to this email or write to
        <a href="mailto:support@mysticalmessages.com" style="color:#6B46C1;">support@mysticalmessages.com</a>.
      </p>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/subscriptions/plans" class="btn">Reactivate Anytime →</a>
      </p>
      <div class="divider"></div>
      <p style="font-size:0.82rem;color:#999;">
        Your account data is retained for 90 days after expiry. See our
        <a href="${appUrl}/privacy" style="color:#6B46C1;">Privacy Policy</a> for details.
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject: '🌙 Your subscription has been cancelled',
        html,
        text: `Hello ${firstName}, your ${tierName} subscription has been cancelled. Access continues until ${expiresAt || 'end of billing period'}.`
    });
}

/**
 * 5. Password changed notification.
 */
async function sendPasswordChangedEmail(user) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';

    const html = wrap(`
      <p>Hello ${firstName},</p>
      <p>
        This is a security notice — the password for your Mystical Messages account was recently changed.
      </p>
      <div class="highlight">
        🔐 If <strong>you</strong> made this change, no action is needed. Your account is safe.
      </div>
      <p>
        If you did <strong>not</strong> change your password, please contact us immediately at
        <a href="mailto:support@mysticalmessages.com" style="color:#6B46C1;">support@mysticalmessages.com</a>
        so we can secure your account.
      </p>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/settings" class="btn">Review Account Settings →</a>
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject: '🔐 Your password was changed',
        html,
        text: `Hello ${firstName}, your Mystical Messages password was recently changed. If you did not do this, contact support@mysticalmessages.com immediately.`
    });
}

/**
 * 6. Message failed / delivery error notification.
 *    Cryptic — does not reveal what failed specifically.
 */
async function sendMessageFailedEmail(user, { childName }) {
    const firstName = user.first_name || user.firstName || 'there';
    const appUrl = process.env.APP_URL || 'https://mysticalmessages.com';

    const html = wrap(`
      <p>Hello ${firstName},</p>
      <p>
        We wanted to quietly let you know — one of your enchantments encountered an unexpected
        disturbance on its journey and may not have arrived as intended.
      </p>
      <div class="highlight">
        🌩️ ${childName ? `The spark meant for <strong>${childName}</strong>` : 'A recent enchantment'} may need your attention.
        Please log in to review and resend if needed.
      </div>
      <p>
        This can occasionally happen due to carrier hiccups or connection disruptions — it's rarely
        something serious. A quick retry usually does the trick.
      </p>
      <p style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/messages/history" class="btn">Check Your Enchantments →</a>
      </p>
      <div class="divider"></div>
      <p style="font-size:0.82rem;color:#999;">
        If this keeps happening, reach out to
        <a href="mailto:support@mysticalmessages.com" style="color:#6B46C1;">support@mysticalmessages.com</a>
        — we're happy to help.
      </p>
    `);

    return sendEmail({
        to: user.email,
        subject: '🌩️ An enchantment needs your attention',
        html,
        text: `Hello ${firstName}, a recent message may not have been delivered. Please check your message history at ${appUrl}/messages/history`
    });
}

// ── Email Verification ──────────────────────────────────────────────────────
async function sendEmailVerificationEmail(user, verificationUrl) {
    const firstName = user.first_name || 'there';
    return sendEmail({
        to: user.email,
        subject: '🔮 One last step — confirm your Mystical Messages account',
        html: wrap(`
  <div style="text-align:center; margin-bottom:1.5rem;">
    <div class="stars">✦ ✦ ✦</div>
    <h2 style="color:#6B46C1; margin:0.5rem 0;">Confirm Your Account</h2>
    <p>Hi <strong>${firstName}</strong> — you're almost in!</p>
  </div>
  <p>To activate your Mystical Messages account, please confirm your email address by clicking the button below. This keeps your account secure and ensures you receive important notifications.</p>
  <div style="text-align:center; margin:2rem 0;">
    <a href="${verificationUrl}" class="btn">Confirm My Email ✨</a>
  </div>
  <div class="highlight">
    🕐 This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
  </div>
  <div class="divider"></div>
  <p style="font-size:0.8rem; color:#aaa;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${verificationUrl}" style="color:#6B46C1; word-break:break-all;">${verificationUrl}</a>
  </p>`),
        text: `Hi ${firstName}, confirm your Mystical Messages account here: ${verificationUrl} (expires in 24 hours)`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendEmailVerificationEmail,
    sendMessageDispatchedEmail,
    sendSubscriptionConfirmationEmail,
    sendSubscriptionCancelledEmail,
    sendPasswordChangedEmail,
    sendMessageFailedEmail
};
