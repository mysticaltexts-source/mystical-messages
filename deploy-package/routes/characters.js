const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all available characters
router.get('/', async (req, res) => {
    try {
        const characters = await db.Character.findAll();
        res.json({ characters });
    } catch (error) {
        console.error('Get characters error:', error);
        res.status(500).json({ error: 'Failed to load characters' });
    }
});

// Get user's selected characters
router.get('/selected', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const characters = await db.Character.findByUserId(req.session.user.id);
        res.json({ characters });
        
    } catch (error) {
        console.error('Get selected characters error:', error);
        res.status(500).json({ error: 'Failed to load selected characters' });
    }
});

// Select characters for user
router.post('/select', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { characterIds } = req.body;
        
        // Check for premium characters
        const allCharacters = await db.Character.findAll();
        const user = await db.User.findById(req.session.user.id);
        
        const premiumCharacterIds = allCharacters
            .filter(c => c.is_premium === 1)
            .map(c => c.id);
        
        const hasPremiumSelection = characterIds.some(id => premiumCharacterIds.includes(id));
        
        if (hasPremiumSelection && user.subscription_tier !== 'premium') {
            return res.status(403).json({ 
                error: 'Premium subscription required for custom characters',
                requiresUpgrade: true
            });
        }
        
        await db.Character.selectForUser(req.session.user.id, characterIds);
        
        res.json({ success: true, message: 'Characters updated!' });
        
    } catch (error) {
        console.error('Select characters error:', error);
        res.status(500).json({ error: 'Failed to select characters' });
    }
});

// Get character details with templates
router.get('/:id', async (req, res) => {
    try {
        const character = await db.Character.findById(req.params.id);
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        const templates = await db.MessageTemplate.findByCharacter(req.params.id);
        
        res.json({ character, templates });
        
    } catch (error) {
        console.error('Get character error:', error);
        res.status(500).json({ error: 'Failed to load character' });
    }
});

// Update character settings for user
router.put('/:id/settings', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { customName, isActive } = req.body;
        
        // This would update user_characters table
        // For now, we'll just return success
        res.json({ success: true });
        
    } catch (error) {
        console.error('Update character settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;