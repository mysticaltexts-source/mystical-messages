const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models/database');
const mailer = require('../lib/mailer');
const {
    signupLimiter,
    loginLimiter,
    recordFailedLogin,
    clearLoginAttempts
} = require('../middleware/protection');

// Helper: generate secure random verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: get app base URL
function getAppUrl(req) {
    return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

// Signup page
router.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile('signup.html', { root: './views' });
});

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile('login.html', { root: './views' });
});

// ─── Validation Helpers ──────────────────────────────────────────────────────

/**
 * Validate email format (RFC-5322 simplified)
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validate US phone number (accepts various formats, normalizes to digits)
 * Accepts: (555) 867-5309 | 555-867-5309 | +15558675309 | 5558675309 | 15558675309
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const digits = phone.replace(/\D/g, '');
    // US numbers: 10 digits or 11 with leading 1
    return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

/**
 * Normalize phone to E.164 (+1XXXXXXXXXX)
 */
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits[0] === '1') return '+' + digits;
    return '+' + digits;
}

/**
 * Escape HTML to prevent XSS in server-rendered content
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// hCaptcha verification helper
async function verifyHcaptcha(token, ip) {
    const secretKey = process.env.HCAPTCHA_SECRET || '0x0000000000000000000000000000000000000000'; // test secret

    if (!token) return false;

    try {
        const params = new URLSearchParams({
            secret: secretKey,
            response: token,
            remoteip: ip,
            sitekey: process.env.HCAPTCHA_SITE_KEY  // ADD THIS LINE
        });
        const resp = await fetch(`https://api.hcaptcha.com/siteverify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        const data = await resp.json();
        console.log('hCaptcha verification response:', JSON.stringify(data));  // ADD LOGGING
        if (!data.success) {
            console.log('hCaptcha error codes:', data['error-codes']);  // ADD LOGGING
        }
        return data.success === true;
    } catch (err) {
        console.error('hCaptcha verification error:', err.message);
        return true;
    }
}


// Signup handler (with rate limiting to prevent bulk account creation)
router.post('/signup', signupLimiter, async (req, res) => {
    try {
        const { email, password, confirmPassword, phone, firstName, lastName, hcaptchaToken } = req.body;
        
        // Validation
        if (!email || !password || !phone) {
            return res.status(400).json({ error: 'Email, password, and phone number are required' });
        }

        // Email format validation
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        // Phone format validation
        if (!isValidPhone(phone)) {
            return res.status(400).json({ error: 'Please enter a valid US phone number (10 digits).' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Verify hCaptcha
        const captchaValid = await verifyHcaptcha(hcaptchaToken, req.ip);
        if (!captchaValid) {
            return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }
        
        // Check if user exists
        const existingUser = await db.User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }
        
        // Normalize inputs before saving
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = normalizePhone(phone);

        // Create user
        const user = await db.User.create(normalizedEmail, password, normalizedPhone, firstName, lastName);

        // Generate email verification token (24-hour expiry)
        const token = generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await db.User.setEmailVerificationToken(user.id, token, expires);

        // Send verification email (non-blocking — don't fail signup if email fails)
        const appUrl = getAppUrl(req);
        const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
        mailer.sendEmailVerificationEmail({ email: normalizedEmail, first_name: firstName }, verificationUrl)
            .catch(err => console.error('Verification email failed:', err.message));

        // Set session (emailVerified: false — limited access until verified)
        req.session.user = {
            id: user.id,
            email: normalizedEmail,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phoneNumber,
            subscriptionTier: 'free',
            emailVerified: false,
            isNewUser: true
        };

        res.json({ 
            success: true, 
            redirect: '/auth/verify-email-notice',
            message: 'Account created! Please check your email to verify your address.'
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'An error occurred during signup. Please try again.' });
    }
});

// Login handler (with brute force protection)
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Basic email format check
        if (!isValidEmail(email)) {
            recordFailedLogin(ip, email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Normalize email before lookup
        const normalizedLoginEmail = email.trim().toLowerCase();
        
        // Find user
        const user = await db.User.findByEmail(normalizedLoginEmail);
        if (!user) {
            recordFailedLogin(ip, normalizedLoginEmail);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        if (!db.User.verifyPassword(user, password)) {
            const attempts = recordFailedLogin(ip, normalizedLoginEmail);
            const remaining = Math.max(0, 5 - attempts.count);
            return res.status(401).json({ 
                error: `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
            });
        }
        
        // Clear failed attempts on successful login
        clearLoginAttempts(ip, normalizedLoginEmail);
        
        // Set session
        req.session.user = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone_number,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status
        };
        
        res.json({ 
            success: true, 
            redirect: '/dashboard',
            message: 'Welcome back!'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
});

// Onboarding page
router.get('/onboarding', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.sendFile('onboarding.html', { root: './views' });
});

// Save onboarding selections
router.post('/onboarding', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { characters, childName, childBirthDate } = req.body;
        
        if (!characters || characters.length === 0) {
            return res.status(400).json({ error: 'Please select at least one character' });
        }
        
        // Save character selections
        await db.Character.selectForUser(req.session.user.id, characters);
        
        // Add child if provided
        if (childName) {
            await db.Child.create(req.session.user.id, childName, childBirthDate);
            req.session.user.children = [{ name: childName }];
        }
        
        req.session.user.isNewUser = false;
        
        res.json({ 
            success: true, 
            redirect: '/dashboard',
            message: 'Onboarding complete! Let the magic begin!'
        });
        
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
});

// Email verification notice page (after signup)
router.get('/verify-email-notice', (req, res) => {
    res.sendFile('verify-email-notice.html', { root: './views' });
});

// Email verification link handler
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.redirect('/auth/verify-email-notice?error=missing');
        }

        const user = await db.User.verifyEmail(token);
        if (!user) {
            return res.redirect('/auth/verify-email-notice?error=invalid');
        }

        // Update session if user is logged in
        if (req.session.user && req.session.user.id === user.id) {
            req.session.user.emailVerified = true;
        }

        // Send welcome email now that email is confirmed
        mailer.sendWelcomeEmail(user).catch(err =>
            console.error('Welcome email failed:', err.message)
        );

        return res.redirect('/auth/onboarding?verified=true');

    } catch (error) {
        console.error('Email verification error:', error);
        return res.redirect('/auth/verify-email-notice?error=server');
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await db.User.findById(req.session.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.email_verified) {
            return res.json({ success: true, message: 'Email already verified!' });
        }

        // Generate a fresh token
        const token = generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await db.User.setEmailVerificationToken(user.id, token, expires);

        const appUrl = getAppUrl(req);
        const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
        await mailer.sendEmailVerificationEmail(user, verificationUrl);

        res.json({ success: true, message: 'Verification email resent! Please check your inbox.' });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email.' });
    }
});

// Phone verification
router.post('/verify-phone', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { code } = req.body;
        
        // In production, integrate with Twilio Verify
        // For MVP, we'll simulate verification
        if (code === '123456' || code === '000000') {
            await db.User.verifyPhone(req.session.user.id);
            req.session.user.phoneVerified = true;
            return res.json({ success: true, message: 'Phone verified successfully!' });
        }
        
        res.status(400).json({ error: 'Invalid verification code' });
        
    } catch (error) {
        console.error('Phone verification error:', error);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true, redirect: '/' });
    });
});

// Check auth status
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
