const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Dashboard home
router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('dashboard.html', { root: './views' });
});

// Get dashboard data
router.get('/data', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated', redirect: '/auth/login' });
        }
        
        const userId = req.session.user.id;
        
        // Get user's selected characters
        const characters = await db.Character.findByUserId(userId);
        
        // Get children
        const children = await db.Child.findByUser(userId);
        
        // Get recent conversations
        const conversations = await db.Conversation.findByUser(userId, 10);
        
        // Get saved scripts
        const scripts = await db.SavedScript.findByUser(userId);
        
        // Get subscription info
        const user = await db.User.findById(userId);
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                subscriptionTier: user.subscription_tier,
                subscriptionStatus: user.subscription_status
            },
            characters,
            children,
            conversations,
            scripts,
            isNewUser: req.session.user.isNewUser
        });
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Quick action buttons data
router.get('/quick-actions', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const quickActions = [
            {
                id: 'lost_tooth',
                title: '🦷 Lost Tooth Emergency',
                description: "Child lost a tooth and you're not prepared",
                characterId: 2,
                scenarioType: 'tooth_lost',
                priority: 1
            },
            {
                id: 'santa_check',
                title: '🎅 Naughty/Nice Check',
                description: "Kid asking about Santa's list RIGHT NOW",
                characterId: 1,
                scenarioType: 'naughty_nice_check',
                priority: 2
            },
            {
                id: 'easter_ready',
                title: '🐰 Easter Visit Alert',
                description: "Easter Bunny needs to send a message",
                characterId: 3,
                scenarioType: 'easter_visit',
                priority: 3
            },
            {
                id: 'gift_confirm',
                title: '🎁 Gift Confirmation',
                description: "Confirm a gift request was received",
                characterId: 1,
                scenarioType: 'gift_confirmation',
                priority: 4
            }
        ];
        
        res.json({ quickActions });
        
    } catch (error) {
        console.error('Quick actions error:', error);
        res.status(500).json({ error: 'Failed to load quick actions' });
    }
});

// Schedule page
router.get('/schedule', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('schedule.html', { root: './views' });
});

// Settings page
router.get('/settings', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('settings.html', { root: './views' });
});

module.exports = router;