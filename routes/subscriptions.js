const express = require('express');
const router = express.Router();
const db = require('../models/database');
const mailer = require('../lib/mailer');
const { paymentLimiter, checkoutLimiter, recordCheckoutSession } = require('../middleware/protection');

// Only initialize Stripe if key is provided and valid
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripeEnabled = stripeKey && stripeKey !== 'your_stripe_secret_key' && stripeKey.startsWith('sk_');
const stripe = stripeEnabled ? require('stripe')(stripeKey) : null;

// Subscription plans
const PLANS = {
    basic: {
        name: 'Basic',
        price: 4.99,
        stripePriceId: 'price_basic_monthly',
        features: [
            'Access to 1 character',
            'Limited message templates',
            'Basic scheduling'
        ]
    },
    standard: {
        name: 'Standard',
        price: 9.99,
        stripePriceId: 'price_standard_monthly',
        features: [
            'All 3 characters',
            'Full template library',
            'Advanced scheduling',
            'Message history'
        ]
    },
    premium: {
        name: 'Premium',
        price: 14.99,
        stripePriceId: 'price_premium_monthly',
        features: [
            'Unlimited custom messages',
            'Custom character creation',
            'Advanced scheduling',
            'Save unlimited scripts',
            'Priority support'
        ]
    }
};

// Plans page - serve HTML
router.get('/plans', (req, res) => {
    res.sendFile('subscription-plans.html', { root: './views' });
});

// Get subscription plans (API)
router.get('/plans-data', (req, res) => {
    res.json({ plans: PLANS });
});

// Get current subscription
router.get('/current', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await db.User.findById(req.session.user.id);
        
        res.json({
            tier: user.subscription_tier,
            status: user.subscription_status,
            stripeCustomerId: user.stripe_customer_id
        });
        
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to load subscription' });
    }
});

// Create checkout session for subscription
router.post('/checkout', paymentLimiter, checkoutLimiter, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { tier } = req.body;
        
        if (!PLANS[tier]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Demo mode: if Stripe is not configured, simulate successful upgrade
        if (!stripeEnabled) {
            const userId = req.session.user.id;
            await db.User.updateSubscription(userId, tier, 'active', null);
            req.session.user.subscriptionTier = tier;

            // Send subscription confirmation email (non-blocking)
            const demoUser = await db.User.findById(userId);
            mailer.sendSubscriptionConfirmationEmail(demoUser, {
                tier,
                amount: PLANS[tier].price,
                renewalDate: null
            }).catch(err => console.error('Subscription email failed:', err.message));

            return res.json({
                demoMode: true,
                success: true,
                message: `Demo mode: Upgraded to ${PLANS[tier].name} plan! (No payment processed)`,
                checkoutUrl: `/subscriptions/success?demo=true&tier=${tier}`
            });
        }
        
        const user = await db.User.findById(req.session.user.id);
        const appUrl = process.env.APP_URL && process.env.APP_URL !== 'http://localhost:3000' 
            ? process.env.APP_URL 
            : 'https://00luf.app.super.myninja.ai';
        
        // Create or get Stripe customer
        let customerId = user.stripe_customer_id;
        
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = customer.id;
            await db.User.updateSubscription(user.id, user.subscription_tier, user.subscription_status, customerId);
        }
        
        // Create checkout session with Stripe Radar metadata for fraud detection
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Mystical Messages - ${PLANS[tier].name} Plan`,
                        description: PLANS[tier].features.join(', ')
                    },
                    unit_amount: Math.round(PLANS[tier].price * 100),
                    recurring: { interval: 'month' }
                },
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${appUrl}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/subscriptions/cancel`,
            // Stripe Radar: enriched metadata for fraud detection rules
            metadata: {
                userId: String(user.id),
                tier: tier,
                userEmail: user.email,
                accountCreatedAt: user.created_at,
                emailVerified: user.email_verified ? 'true' : 'false',
                phoneVerified: user.phone_verified ? 'true' : 'false',
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || 'unknown'
            }
        });
        
        // Record checkout session to prevent rapid repeated checkouts
        recordCheckoutSession(user.id);
        
        res.json({ 
            checkoutUrl: session.url,
            sessionId: session.id
        });
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session. Please try again later.' });
    }
});

// One-time payment for trial message
router.post('/one-time', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Demo mode
        if (!stripeEnabled) {
            return res.json({
                demoMode: true,
                success: true,
                message: 'Demo mode: Trial message unlocked! (No payment processed)',
                clientSecret: 'demo_secret'
            });
        }
        
        const user = await db.User.findById(req.session.user.id);
        
        // Create or get Stripe customer
        let customerId = user.stripe_customer_id;
        
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = customer.id;
        }
        
        // Create payment intent for $0.99 with Stripe Radar metadata
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 99,
            currency: 'usd',
            customer: customerId,
            // Stripe Radar: enriched metadata helps detect and block fraudulent patterns
            metadata: {
                userId: String(user.id),
                type: 'one_time_message',
                userEmail: user.email,
                emailVerified: user.email_verified ? 'true' : 'false',
                phoneVerified: user.phone_verified ? 'true' : 'false',
                accountCreatedAt: user.created_at,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || 'unknown'
            }
        });
        
        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: 0.99
        });
        
    } catch (error) {
        console.error('One-time payment error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// Success page
router.get('/success', (req, res) => {
    res.sendFile('subscription-success.html', { root: './views' });
});

// Cancel page
router.get('/cancel', (req, res) => {
    res.sendFile('subscription-cancel.html', { root: './views' });
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await db.User.findById(req.session.user.id);

        // Demo mode: if Stripe is not configured, just downgrade locally
        if (!stripeEnabled) {
            await db.User.updateSubscription(user.id, 'free', 'inactive');
            req.session.user.subscriptionTier = 'free';
            req.session.user.subscriptionStatus = 'inactive';

            mailer.sendSubscriptionCancelledEmail(user, {
                tier: user.subscription_tier,
                expiresAt: null
            }).catch(err => console.error('Cancel email failed:', err.message));

            return res.json({
                demoMode: true,
                success: true,
                message: 'Demo mode: Subscription cancelled and reverted to free plan.'
            });
        }
        
        if (!user.stripe_customer_id) {
            return res.status(400).json({ error: 'No active subscription found' });
        }
        
        // Get active subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: 'active'
        });
        
        if (subscriptions.data.length === 0) {
            return res.status(400).json({ error: 'No active subscription found' });
        }
        
        // Cancel at period end
        await stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: true
        });
        
        await db.User.updateSubscription(user.id, user.subscription_tier, 'canceling');

        // Get period end date from Stripe for the email
        const expiresAt = subscriptions.data[0].current_period_end
            ? new Date(subscriptions.data[0].current_period_end * 1000)
            : null;

        // Send cancellation confirmation email (non-blocking)
        mailer.sendSubscriptionCancelledEmail(user, {
            tier: user.subscription_tier,
            expiresAt
        }).catch(err => console.error('Cancel email failed:', err.message));
        
        res.json({ 
            success: true, 
            message: 'Subscription will cancel at the end of the billing period' 
        });
        
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.metadata.userId;
            const tier = session.metadata.tier;
            
            await db.User.updateSubscription(userId, tier, 'active', session.customer);
            console.log(`Subscription activated for user ${userId}, tier: ${tier}`);

            // Send subscription confirmation email
            try {
                const activatedUser = await db.User.findById(userId);
                if (activatedUser) {
                    const planAmount = PLANS[tier] ? PLANS[tier].price : null;
                    mailer.sendSubscriptionConfirmationEmail(activatedUser, {
                        tier,
                        amount: planAmount,
                        renewalDate: session.expires_at ? new Date(session.expires_at * 1000) : null
                    }).catch(err => console.error('Stripe sub confirmation email failed:', err.message));
                }
            } catch (emailErr) {
                console.error('Could not send subscription email:', emailErr.message);
            }
            break;
            
        case 'customer.subscription.updated':
            const subscription = event.data.object;
            // Handle subscription updates
            break;
            
        case 'customer.subscription.deleted':
            const deletedSub = event.data.object;
            // Handle subscription cancellation
            const customer = await db.User.findById(deletedSub.metadata.userId);
            if (customer) {
                await db.User.updateSubscription(customer.id, 'free', 'inactive');
            }
            break;
            
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            if (paymentIntent.metadata.type === 'one_time_message') {
                // Grant one-time message credit
                console.log(`One-time payment succeeded for user ${paymentIntent.metadata.userId}`);
            }
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
});

module.exports = router;