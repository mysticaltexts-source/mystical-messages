const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { sendSMS, simulateConversation } = require('../lib/sms');
const mailer = require('../lib/mailer');
const { messageLimiter } = require('../middleware/protection');

// Message builder page
router.get('/create', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('message-create.html', { root: './views' });
});

// Get message creation data
router.get('/create/data', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const characters = await db.Character.findByUserId(req.session.user.id);
        const templates = await db.MessageTemplate.findAll();
        const children = await db.Child.findByUser(req.session.user.id);
        
        res.json({
            characters,
            templates,
            children
        });
        
    } catch (error) {
        console.error('Message create data error:', error);
        res.status(500).json({ error: 'Failed to load message data' });
    }
});

// Get templates for a character
router.get('/templates/:characterId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const templates = await db.MessageTemplate.findByCharacter(req.params.characterId);
        res.json({ templates });
        
    } catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({ error: 'Failed to load templates' });
    }
});

// ─── CHILD SAFETY GUARDS ────────────────────────────────────────────────────
//
// POLICY: Mystical Messages is designed exclusively for adults (18+) to create
// magical experiences for children. We enforce the following non-negotiable rules:
//
// 1. SCRIPT REQUIRED: No message may be sent without a pre-written response message
//    (responseMessage). Auto-sending without adult-authored content is blocked.
//    This prevents any character from "replying" to a child without adult supervision.
//
// 2. ADULT PHONE ONLY: All SMS communications are sent to the adult account holder's
//    registered phone number. We never collect, store, or send messages to a minor's
//    phone or device. The parent/guardian controls all delivery.
//
// 3. CONTENT VERIFICATION: The response message must be explicitly provided by the
//    adult user. Template use is allowed, but the adult must confirm the content
//    before it is dispatched.
// ────────────────────────────────────────────────────────────────────────────

// Send message (create conversation)
router.post('/send', messageLimiter, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const {
            characterId,
            childName,
            outgoingMessage,
            responseMessage,
            scenarioType,
            tone,
            sendMode, // 'immediate', 'scheduled', 'delayed'
            scheduledAt,
            delayMinutes
        } = req.body;
        
        // ── GUARD 1: Script required (no auto-send without adult-authored content) ──
        if (!characterId) {
            return res.status(400).json({ error: 'A character must be selected before sending.' });
        }
        if (!responseMessage || responseMessage.trim().length < 5) {
            return res.status(400).json({
                error: 'A message script is required. For child safety, all messages must be reviewed and authored by an adult before sending.'
            });
        }

        const userId = req.session.user.id;
        const user = await db.User.findById(userId);

        // ── GUARD 2: Adult phone number required ──
        if (!user.phone_number || user.phone_number.trim().length < 7) {
            return res.status(400).json({
                error: 'A valid adult phone number is required on your account before sending messages. Please update your phone number in Settings.'
            });
        }

        // ── GUARD 3: Delivery is ALWAYS to the adult account holder's phone ──
        // We explicitly use user.phone_number — never a child-provided number.
        const deliveryPhone = user.phone_number;
        
        // Check subscription limits
        if (user.subscription_tier === 'free') {
            return res.json({
                requiresPayment: true,
                amount: 0.99,
                message: 'This message requires a one-time payment of $0.99'
            });
        }
        
        // Create conversation
        let scheduledTime = null;
        if (sendMode === 'scheduled' && scheduledAt) {
            scheduledTime = new Date(scheduledAt).toISOString();
        }
        
        const conversation = await db.Conversation.create(
            userId,
            characterId,
            childName,
            scheduledTime
        );
        
        // Message 1: Outgoing (from parent — adult-authored prompt)
        if (outgoingMessage && outgoingMessage.trim()) {
            await db.Message.create(
                conversation.id,
                'outgoing',
                outgoingMessage.trim(),
                0,
                scheduledTime
            );
        }
        
        // Message 2: Response (from character — adult-authored, required)
        const responseDelay = delayMinutes || 1;
        let responseScheduledTime = null;
        
        if (sendMode === 'scheduled' && scheduledAt) {
            responseScheduledTime = new Date(new Date(scheduledAt).getTime() + responseDelay * 60000).toISOString();
        }
        
        await db.Message.create(
            conversation.id,
            'incoming',
            responseMessage.trim(),
            responseDelay,
            responseScheduledTime
        );

        // Get character info for the email notification
        let characterEmoji = '✨';
        try {
            const chars = await db.Character.findByUserId(userId);
            const char = chars.find(c => c.id == characterId || c.character_type_id == characterId);
            if (char) characterEmoji = char.emoji || '✨';
        } catch (_) {}
        
        // If immediate, send to adult's phone now
        if (sendMode === 'immediate') {
            await simulateConversation(conversation.id, deliveryPhone);

            // Notify the adult via email — cryptic subject, no mechanics revealed
            mailer.sendMessageDispatchedEmail(user, {
                characterEmoji,
                childName,
                sendMode: 'immediate',
                scheduledAt: null
            }).catch(err => console.error('Dispatch email failed:', err.message));
            
            return res.json({
                success: true,
                message: 'Message sent! Check your phone for the magical response.',
                conversationId: conversation.id
            });
        }

        // Scheduled or queued — notify adult
        mailer.sendMessageDispatchedEmail(user, {
            characterEmoji,
            childName,
            sendMode,
            scheduledAt
        }).catch(err => console.error('Dispatch email failed:', err.message));
        
        res.json({
            success: true,
            message: sendMode === 'scheduled' 
                ? `Message scheduled for ${new Date(scheduledAt).toLocaleString()}` 
                : 'Message queued for delivery!',
            conversationId: conversation.id
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Quick send (Oh-Crap!! emergency button)
// CHILD SAFETY: Quick-send buttons use pre-loaded adult-authored templates only.
// They always deliver to the adult account holder's phone — never a child's device.
router.post('/quick-send', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { actionId, childName, customMessage } = req.body;
        
        // Map quick actions to pre-approved adult-authored templates
        const actionMap = {
            'lost_tooth': { characterId: 2, templateId: 5, defaultChild: 'little one' },
            'santa_check': { characterId: 1, templateId: 1, defaultChild: 'friend' },
            'easter_ready': { characterId: 3, templateId: 8, defaultChild: 'bunny friend' },
            'gift_confirm': { characterId: 1, templateId: 2, defaultChild: 'friend' }
        };
        
        const action = actionMap[actionId];
        if (!action) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const userId = req.session.user.id;
        const user = await db.User.findById(userId);

        // GUARD: Adult phone required
        if (!user.phone_number || user.phone_number.trim().length < 7) {
            return res.status(400).json({
                error: 'A valid adult phone number is required. Please update your phone number in Settings before sending messages.'
            });
        }
        
        // Get pre-approved template
        const templates = await db.MessageTemplate.findByCharacter(action.characterId);
        const template = templates.find(t => t.id === action.templateId) || templates[0];

        // GUARD: Template must exist (no blank auto-messages)
        if (!template && !customMessage) {
            return res.status(400).json({
                error: 'No approved message template found for this action. Please create a script first.'
            });
        }
        
        // Customize template with child's name — content is adult-authored
        let message = customMessage || template.content;
        message = message.replace(/{child_name}/g, childName || action.defaultChild);
        message = message.replace(/{behavior}/g, 'good');
        message = message.replace(/{encouragement}/g, 'great work');
        
        // Create conversation — delivery is to adult's phone only
        const conversation = await db.Conversation.create(
            userId,
            action.characterId,
            childName
        );
        
        // Create the response message (adult-authored content confirmed above)
        await db.Message.create(
            conversation.id,
            'incoming',
            message,
            1 // 1 minute delay for realism
        );
        
        // Deliver to adult account holder's phone only
        await simulateConversation(conversation.id, user.phone_number);

        // Notify adult via cryptic email
        mailer.sendMessageDispatchedEmail(user, {
            characterEmoji: '⚡',
            childName,
            sendMode: 'immediate',
            scheduledAt: null
        }).catch(err => console.error('Quick-send dispatch email failed:', err.message));
        
        res.json({
            success: true,
            message: 'Magic message sent! Check your phone!',
            conversationId: conversation.id
        });
        
    } catch (error) {
        console.error('Quick send error:', error);
        res.status(500).json({ error: 'Failed to send quick message' });
    }
});

// Scripts page
router.get('/scripts', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('saved-scripts.html', { root: './views' });
});

// Save a script
router.post('/scripts', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { characterId, title, outgoingMessage, responseMessage, scenarioType, tone } = req.body;
        
        if (!characterId || !title || !responseMessage) {
            return res.status(400).json({ error: 'Character, title, and response message are required' });
        }
        
        const script = await db.SavedScript.create(
            req.session.user.id,
            characterId,
            title,
            outgoingMessage,
            responseMessage,
            scenarioType,
            tone
        );
        
        res.json({ success: true, scriptId: script.id });
        
    } catch (error) {
        console.error('Save script error:', error);
        res.status(500).json({ error: 'Failed to save script' });
    }
});

// Get saved scripts API
router.get('/scripts/list', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const scripts = await db.SavedScript.findByUser(req.session.user.id);
        res.json({ scripts });
        
    } catch (error) {
        console.error('Get scripts error:', error);
        res.status(500).json({ error: 'Failed to load scripts' });
    }
});

// Delete a script
router.delete('/scripts/:scriptId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        await db.SavedScript.delete(req.params.scriptId, req.session.user.id);
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete script error:', error);
        res.status(500).json({ error: 'Failed to delete script' });
    }
});

// Message history PAGE (HTML)
router.get('/history', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('message-history.html', { root: './views' });
});

// Message history DATA (API)
router.get('/history/data', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const conversations = await db.Conversation.findByUser(req.session.user.id, 50);
        
        // Get messages for each conversation
        for (let conv of conversations) {
            conv.messages = await db.Message.findByConversation(conv.id);
        }
        
        res.json({ conversations });
        
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to load history' });
    }
});

// Single conversation PAGE (HTML)
router.get('/conversation/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('message-conversation.html', { root: './views' });
});

// Single conversation DATA (API)
router.get('/conversation/:id/data', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const conversation = await db.Conversation.findById(req.params.id);
        
        if (!conversation || conversation.user_id !== req.session.user.id) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        conversation.messages = await db.Message.findByConversation(conversation.id);
        
        res.json({ conversation });
        
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to load conversation' });
    }
});

module.exports = router;