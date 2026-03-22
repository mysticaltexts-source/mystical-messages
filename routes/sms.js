/**
 * routes/sms.js — Twilio Inbound SMS Webhook
 *
 * Twilio calls this endpoint when a user replies to our number.
 * It handles STOP/START (TCPA opt-out/opt-in) and general responses.
 *
 * Configure in Twilio Console:
 *   Phone Number → Messaging → "A message comes in" → Webhook → POST https://yourdomain.com/sms/incoming
 */

const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const sms = require('../lib/sms');

/**
 * Validate that the request genuinely came from Twilio.
 * Uses the X-Twilio-Signature header and the webhook secret.
 * Skip validation in dev/demo mode (no auth token configured).
 */
function twilioWebhookAuth(req, res, next) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;

    // Skip auth if Twilio is not configured (dev/demo mode)
    if (!authToken || !twilioSid || twilioSid === 'your_twilio_account_sid') {
        console.log('[SMS webhook] Twilio not configured — skipping signature validation');
        return next();
    }

    // Build the full URL Twilio signed
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const signature = req.headers['x-twilio-signature'];
    if (!signature) {
        console.warn('⚠️  SMS webhook received without X-Twilio-Signature — rejected');
        return res.status(403).send('Forbidden');
    }

    const isValid = twilio.validateRequest(authToken, signature, fullUrl, req.body);
    if (!isValid) {
        console.warn('⚠️  SMS webhook signature validation failed — rejected');
        return res.status(403).send('Forbidden');
    }

    next();
}

/**
 * POST /sms/incoming
 * Twilio webhook — processes inbound SMS from users.
 * Must respond with TwiML (even if empty) within 15 seconds.
 */
router.post('/incoming',
    // Parse URL-encoded body (Twilio sends application/x-www-form-urlencoded)
    express.urlencoded({ extended: false }),
    twilioWebhookAuth,
    async (req, res) => {
        try {
            const result = await sms.handleIncomingSMS(req.body);

            console.log('📲 SMS webhook processed:', result);

            // Always respond with TwiML — empty response means "no auto-reply"
            // (our handleIncomingSMS sends replies directly via the Twilio API)
            res.set('Content-Type', 'text/xml');
            res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

        } catch (err) {
            console.error('❌ SMS webhook error:', err);
            // Still respond with empty TwiML so Twilio doesn't retry
            res.set('Content-Type', 'text/xml');
            res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        }
    }
);

/**
 * POST /sms/status
 * Optional: Twilio delivery status callback.
 * Logs delivery receipts (delivered, failed, undelivered, etc.)
 */
router.post('/status',
    express.urlencoded({ extended: false }),
    async (req, res) => {
        try {
            const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = req.body;

            if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
                console.error(`❌ SMS delivery failed — SID: ${MessageSid}, To: ${To}, Error: ${ErrorCode} ${ErrorMessage}`);
            } else {
                console.log(`📬 SMS status update — SID: ${MessageSid}, Status: ${MessageStatus}, To: ${To}`);
            }

            res.sendStatus(204);
        } catch (err) {
            console.error('SMS status webhook error:', err);
            res.sendStatus(204);
        }
    }
);

/**
 * GET /sms/health
 * Simple health check to confirm the webhook endpoint is reachable.
 */
router.get('/health', (req, res) => {
    res.json({
        ok: true,
        twilioConfigured: sms.isConfigured(),
        message: 'SMS webhook endpoint is active'
    });
});

module.exports = router;