const express = require('express');
const router = express.Router();
const db = require('../models/database');
const mailer = require('../lib/mailer');

// Public config endpoint (no auth required — returns only public keys)
router.get('/config', (req, res) => {
    res.json({
        hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001',
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        appUrl: process.env.APP_URL || ''
    });
});

// Get all data needed for the app
router.get('/init', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const userId = req.session.user.id;
        
        const [characters, children, templates] = await Promise.all([
            db.Character.findByUserId(userId),
            db.Child.findByUser(userId),
            db.MessageTemplate.findAll()
        ]);
        
        res.json({
            characters,
            children,
            templates
        });
        
    } catch (error) {
        console.error('API init error:', error);
        res.status(500).json({ error: 'Failed to initialize' });
    }
});

// Children CRUD
router.get('/children', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const children = await db.Child.findByUser(req.session.user.id);
        res.json({ children });
        
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({ error: 'Failed to load children' });
    }
});

router.post('/children', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { name, birthDate, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Child name is required' });
        }
        
        const child = await db.Child.create(req.session.user.id, name, birthDate, notes);
        res.json({ success: true, child });
        
    } catch (error) {
        console.error('Create child error:', error);
        res.status(500).json({ error: 'Failed to add child' });
    }
});

router.delete('/children/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        await db.Child.delete(req.params.id, req.session.user.id);
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete child error:', error);
        res.status(500).json({ error: 'Failed to delete child' });
    }
});

// User profile
router.get('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await db.User.findById(req.session.user.id);
        
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone_number,
            phoneVerified: user.phone_verified === 1,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

router.put('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { firstName, lastName, phone } = req.body;

        if (!firstName || !firstName.trim()) {
            return res.status(400).json({ error: 'First name is required' });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const database = db.getDb();
        database.prepare(
            `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(firstName.trim(), lastName ? lastName.trim() : '', phone.trim(), req.session.user.id);
        
        // Update session
        req.session.user.firstName = firstName.trim();
        req.session.user.lastName = lastName ? lastName.trim() : '';
        req.session.user.phone = phone.trim();
        
        res.json({ success: true, message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.put('/password', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        // Verify current password
        const user = await db.User.findById(req.session.user.id);
        if (!db.User.verifyPassword(user, currentPassword)) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const database = db.getDb();
        database.prepare(
            `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(hashedPassword, req.session.user.id);

        // Send security notification email (non-blocking)
        mailer.sendPasswordChangedEmail({
            email: req.session.user.email,
            first_name: req.session.user.firstName
        }).catch(err => console.error('Password changed email failed:', err.message));

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Search templates
router.get('/templates/search', async (req, res) => {
    try {
        const { q, characterId, scenarioType } = req.query;
        
        let templates = await db.MessageTemplate.findAll();
        
        if (characterId) {
            templates = templates.filter(t => t.character_id === parseInt(characterId));
        }
        
        if (scenarioType) {
            templates = templates.filter(t => t.scenario_type === scenarioType);
        }
        
        if (q) {
            const query = q.toLowerCase();
            templates = templates.filter(t => 
                t.title.toLowerCase().includes(query) ||
                t.content.toLowerCase().includes(query)
            );
        }
        
        res.json({ templates });
        
    } catch (error) {
        console.error('Search templates error:', error);
        res.status(500).json({ error: 'Failed to search templates' });
    }
});

// Get scenario types
router.get('/scenarios', (req, res) => {
    const scenarios = [
        { id: 'tooth_lost', name: 'Tooth Lost', characterId: 2 },
        { id: 'tooth_collection', name: 'Tooth Collection', characterId: 2 },
        { id: 'naughty_nice_check', name: 'Naughty/Nice Check', characterId: 1 },
        { id: 'gift_confirmation', name: 'Gift Confirmation', characterId: 1 },
        { id: 'christmas_eve', name: 'Christmas Eve Update', characterId: 1 },
        { id: 'behavior_reminder', name: 'Behavior Reminder', characterId: 1 },
        { id: 'easter_visit', name: 'Easter Visit', characterId: 3 },
        { id: 'egg_hunt_ready', name: 'Egg Hunt Prep', characterId: 3 },
        { id: 'spring_message', name: 'Spring Greeting', characterId: 3 },
        { id: 'custom', name: 'Custom Message', characterId: null }
    ];
    
    res.json({ scenarios });
});

// Get tones
router.get('/tones', (req, res) => {
    const tones = [
        { id: 'playful', name: 'Playful & Fun', description: 'Light-hearted and cheerful' },
        { id: 'magical', name: 'Magical & Wondrous', description: 'Enchanting and mysterious' },
        { id: 'formal', name: 'Formal & Traditional', description: 'Classic and proper' },
        { id: 'funny', name: 'Funny & Silly', description: 'Humorous and entertaining' }
    ];
    
    res.json({ tones });
});

module.exports = router;