/**
 * Account Protection Middleware
 * Rate limiting, brute force protection, and abuse prevention
 */

const rateLimit = require('express-rate-limit');

// ============================================
// GENERAL API RATE LIMITER
// ============================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// SIGNUP RATE LIMITER (Prevents bulk account creation)
// ============================================
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 signup attempts per IP per hour
    message: {
        error: 'Too many accounts created from this IP. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count successful signups too
});

// ============================================
// LOGIN RATE LIMITER (Prevents brute force)
// ============================================
const loginAttemptStore = new Map();

const loginLimiter = (req, res, next) => {
    const ip = req.ip;
    const email = req.body.email?.toLowerCase() || '';
    const key = `${ip}:${email}`;
    
    // Get or create attempt record
    let attempts = loginAttemptStore.get(key) || { count: 0, lockedUntil: null, firstAttempt: Date.now() };
    
    // Check if account is temporarily locked
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
        return res.status(429).json({
            error: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
            locked: true,
            retryAfter: remainingMinutes * 60
        });
    }
    
    // Reset if window expired (15 minutes)
    if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
        attempts = { count: 0, lockedUntil: null, firstAttempt: Date.now() };
    }
    
    // Store attempt for use in response
    req.loginAttempts = attempts;
    
    next();
};

// Call this after failed login
const recordFailedLogin = (ip, email) => {
    const key = `${ip}:${email?.toLowerCase() || ''}`;
    let attempts = loginAttemptStore.get(key) || { count: 0, lockedUntil: null, firstAttempt: Date.now() };
    
    attempts.count++;
    attempts.firstAttempt = attempts.firstAttempt || Date.now();
    
    // Lock account after 5 failed attempts
    if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minute lock
        console.log(`🔒 Account locked for ${email} from IP ${ip}`);
    }
    
    loginAttemptStore.set(key, attempts);
    return attempts;
};

// Call this after successful login
const clearLoginAttempts = (ip, email) => {
    const key = `${ip}:${email?.toLowerCase() || ''}`;
    loginAttemptStore.delete(key);
};

// ============================================
// MESSAGE RATE LIMITER (Prevents SMS abuse)
// ============================================
const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 messages per hour per user
    message: {
        error: 'Message limit reached. Please wait before sending more messages.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// PAYMENT RATE LIMITER (Prevents payment fraud)
// ============================================
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 payment attempts per hour
    message: {
        error: 'Too many payment attempts. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// CHECKOUT SESSION LIMITER (Per user)
// ============================================
const checkoutSessionStore = new Map();

const checkoutLimiter = (req, res, next) => {
    const userId = req.session?.user?.id;
    if (!userId) return next();
    
    const key = `checkout_${userId}`;
    const lastCheckout = checkoutSessionStore.get(key);
    
    // Only 1 checkout session per user per 5 minutes
    if (lastCheckout && Date.now() - lastCheckout < 5 * 60 * 1000) {
        const remainingSeconds = Math.ceil((5 * 60 * 1000 - (Date.now() - lastCheckout)) / 1000);
        return res.status(429).json({
            error: 'Please wait before creating another checkout session.',
            retryAfter: remainingSeconds
        });
    }
    
    next();
};

const recordCheckoutSession = (userId) => {
    checkoutSessionStore.set(`checkout_${userId}`, Date.now());
};

// ============================================
// SUSPICIOUS ACTIVITY DETECTOR
// ============================================
const suspiciousActivityStore = new Map();

const detectSuspiciousActivity = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Get or create activity record
    let activity = suspiciousActivityStore.get(ip) || { 
        signupAttempts: 0, 
        loginAttempts: 0, 
        lastReset: now 
    };
    
    // Reset counters every hour
    if (now - activity.lastReset > 60 * 60 * 1000) {
        activity = { signupAttempts: 0, loginAttempts: 0, lastReset: now };
    }
    
    // Track patterns
    if (req.path.includes('/signup')) activity.signupAttempts++;
    if (req.path.includes('/login')) activity.loginAttempts++;
    
    suspiciousActivityStore.set(ip, activity);
    
    // Flag suspicious patterns
    if (activity.signupAttempts > 5 || activity.loginAttempts > 20) {
        console.log(`⚠️ Suspicious activity detected from IP ${ip}:`, activity);
        // In production, you could log this to a security service
    }
    
    next();
};

// ============================================
// CLEANUP (Run periodically)
// ============================================
setInterval(() => {
    const now = Date.now();
    
    // Clean up login attempts older than 1 hour
    for (const [key, value] of loginAttemptStore.entries()) {
        if (now - value.firstAttempt > 60 * 60 * 1000) {
            loginAttemptStore.delete(key);
        }
    }
    
    // Clean up checkout sessions older than 1 hour
    for (const [key, timestamp] of checkoutSessionStore.entries()) {
        if (now - timestamp > 60 * 60 * 1000) {
            checkoutSessionStore.delete(key);
        }
    }
    
    // Clean up suspicious activity records older than 2 hours
    for (const [key, value] of suspiciousActivityStore.entries()) {
        if (now - value.lastReset > 2 * 60 * 60 * 1000) {
            suspiciousActivityStore.delete(key);
        }
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = {
    apiLimiter,
    signupLimiter,
    loginLimiter,
    recordFailedLogin,
    clearLoginAttempts,
    messageLimiter,
    paymentLimiter,
    checkoutLimiter,
    recordCheckoutSession,
    detectSuspiciousActivity
};
