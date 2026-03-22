const twilio = require('twilio');

// Initialize Twilio client (will be null if credentials not set)
let twilioClient = null;
let twilioPhoneNumber = null;

function initTwilio() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        console.log('✅ Twilio client initialized');
    } else {
        console.log('⚠️ Twilio credentials not configured - SMS will be simulated');
    }
}

// Initialize on load
initTwilio();

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX for US numbers)
 */
function normalizeToE164(phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) return '+' + digits;
    if (digits.length === 10) return '+1' + digits;
    return '+' + digits; // international / unknown — pass through
}

/**
 * Send an SMS message
 * Guards against opted-out numbers (TCPA compliance).
 *
 * @param {string} to   - Phone number to send to
 * @param {string} body - Message content
 * @returns {Promise<object>} - Result with success status and message SID
 */
async function sendSMS(to, body) {
    const db = require('../models/database');

    // ── TCPA Guard: never send to opted-out numbers ─────────────────────────
    const normalizedTo = normalizeToE164(to);
    const optedOut = db.User.isSmsOptedOut(normalizedTo);
    if (optedOut) {
        console.warn(`🚫 [SMS BLOCKED - OPT-OUT] ${normalizedTo} has opted out of SMS. Message not sent.`);
        return {
            success: false,
            blocked: true,
            reason: 'opt_out',
            to: normalizedTo
        };
    }

    // If Twilio is not configured, simulate
    if (!twilioClient) {
        console.log(`[SIMULATED SMS] To: ${normalizedTo}, Body: ${body}`);
        return {
            success: true,
            simulated: true,
            sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
            to: normalizedTo,
            body
        };
    }
    
    try {
        const message = await twilioClient.messages.create({
            body: body,
            from: twilioPhoneNumber,
            to: normalizedTo
        });
        
        console.log(`✅ SMS sent: ${message.sid}`);
        
        return {
            success: true,
            sid: message.sid,
            to: normalizedTo,
            body: body
        };
        
    } catch (error) {
        console.error('❌ SMS send error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Simulate a conversation (for demo purposes without Twilio)
 * @param {number} conversationId - The conversation ID
 * @param {string} phoneNumber - User's phone number
 */
async function simulateConversation(conversationId, phoneNumber) {
    const db = require('../models/database');
    
    // Get conversation details
    const conversation = await db.Conversation.findById(conversationId);
    const messages = await db.Message.findByConversation(conversationId);
    
    if (!conversation || messages.length === 0) {
        console.log('No messages to send');
        return;
    }
    
    // Get the incoming message (from character)
    const incomingMessages = messages.filter(m => m.message_type === 'incoming');
    
    for (const msg of incomingMessages) {
        const characterName = conversation.character_name;
        const formattedMessage = `${characterName}: ${msg.content}`;
        const delayMinutes = msg.delay_minutes || 0;
        
        if (delayMinutes > 0) {
            console.log(`⏰ Message scheduled for ${delayMinutes} minute(s) from now`);
        }
        
        const result = await sendSMS(phoneNumber, formattedMessage);
        
        if (result.success) {
            await db.Message.updateStatus(msg.id, 'sent', result.sid);
        } else if (result.blocked) {
            await db.Message.updateStatus(msg.id, 'blocked_opt_out');
        } else {
            await db.Message.updateStatus(msg.id, 'failed');
        }
    }
    
    await db.Conversation.updateStatus(conversationId, 'completed');
}

/**
 * Send initial consent message
 * @param {string} phoneNumber - User's phone number
 * @param {string} characterName - Name of the character
 * @returns {Promise<object>}
 */
async function sendConsentMessage(phoneNumber, characterName) {
    const message = `You've requested messages from ${characterName} via Mystical Messages. Reply YES to confirm and start receiving magical messages! 🌟 Reply STOP at any time to opt out.`;
    return await sendSMS(phoneNumber, message);
}

/**
 * Handle incoming SMS (webhook from Twilio)
 * Processes STOP/START commands and updates the database accordingly.
 *
 * @param {object} webhookData - Data from Twilio webhook
 * @returns {Promise<object>} - Result describing the action taken
 */
async function handleIncomingSMS(webhookData) {
    const db = require('../models/database');
    const { From, Body, MessageSid } = webhookData;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body} [SID: ${MessageSid}]`);
    
    const normalizedFrom = normalizeToE164(From);
    const upperBody = (Body || '').trim().toUpperCase();
    
    // ── TCPA STOP / UNSUBSCRIBE handling ─────────────────────────────────────
    const STOP_KEYWORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    if (STOP_KEYWORDS.includes(upperBody)) {
        console.log(`🚫 STOP request from ${normalizedFrom} — opting out in database`);
        
        // ✅ Update database (TCPA-required)
        db.User.smsOptOut(normalizedFrom);
        
        // Twilio auto-handles the STOP reply per carrier regulations,
        // but we send our own confirmation as a best practice.
        // NOTE: We must send this even to opted-out numbers — it's the opt-out confirmation.
        if (twilioClient) {
            try {
                await twilioClient.messages.create({
                    body: 'You have been unsubscribed from Mystical Messages. No further messages will be sent. Reply START to re-subscribe.',
                    from: twilioPhoneNumber,
                    to: normalizedFrom
                });
            } catch (err) {
                // Twilio may auto-block the reply — that's fine
                console.log('STOP confirmation reply handled by carrier:', err.message);
            }
        } else {
            console.log(`[SIMULATED] STOP confirmation reply to ${normalizedFrom}`);
        }
        
        return { type: 'opt_out', from: normalizedFrom };
    }
    
    // ── START / re-subscribe handling ─────────────────────────────────────────
    const START_KEYWORDS = ['START', 'YES', 'UNSTOP', 'RESUBSCRIBE'];
    if (START_KEYWORDS.includes(upperBody) || upperBody === 'Y') {
        console.log(`✅ START/YES from ${normalizedFrom} — opting back in`);
        
        // ✅ Update database
        db.User.smsOptIn(normalizedFrom);
        
        await sendSMS(normalizedFrom, '✨ Wonderful! You\'re all set to receive magical messages again. Stay tuned for something special!');
        
        return { type: 'opt_in', from: normalizedFrom };
    }
    
    // ── General response ──────────────────────────────────────────────────────
    return { type: 'response', from: normalizedFrom, body: Body };
}

/**
 * Generate a preview of what the SMS will look like
 * @param {string} characterName - Name of the character
 * @param {string} message - Message content
 * @returns {string} - Formatted preview
 */
function generatePreview(characterName, message) {
    return `${characterName}: ${message}`;
}

module.exports = {
    sendSMS,
    simulateConversation,
    sendConsentMessage,
    handleIncomingSMS,
    generatePreview,
    normalizeToE164,
    isConfigured: () => twilioClient !== null
};
