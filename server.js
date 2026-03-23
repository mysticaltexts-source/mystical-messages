require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const Database = require('better-sqlite3');
const db = require('./models/database');

// Import protection middleware
const {
    apiLimiter,
    signupLimiter,
    loginLimiter,
    messageLimiter,
    paymentLimiter,
    detectSuspiciousActivity
} = require('./middleware/protection');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const messageRoutes = require('./routes/messages');
const characterRoutes = require('./routes/characters');
const subscriptionRoutes = require('./routes/subscriptions');
const apiRoutes = require('./routes/api');
const smsRoutes = require('./routes/sms');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Session Secret Strength Warning ───────────────────────────────────────
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32 || sessionSecret === 'mystical-magic-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: SESSION_SECRET is weak or using default. Set a strong random secret in .env before going live!');
    console.warn('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
}

// Trust reverse proxy (needed for secure cookies behind HTTPS proxy)
app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ──────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",          // needed for inline JS in HTML files
                "https://js.hcaptcha.com",
                "https://hcaptcha.com",
                "https://js.stripe.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",          // needed for inline styles
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:"
            ],
            connectSrc: [
                "'self'",
                "https://hcaptcha.com",
                "https://api.hcaptcha.com",
                "https://api.stripe.com",
                "https://newassets.hcaptcha.com"
            ],
            frameSrc: [
                "https://js.hcaptcha.com",
                "https://hcaptcha.com",
                "https://js.stripe.com",
                "https://hooks.stripe.com",
                "https://newassets.hcaptcha.com"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    // Allow iframes from Stripe / hCaptcha
    frameguard: { action: 'sameorigin' },
    // HSTS: 1 year + include subdomains
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    // Prevent MIME sniffing
    noSniff: true,
    // XSS Filter (legacy IE)
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply suspicious activity detection to all requests
app.use(detectSuspiciousActivity);

// Apply general API rate limiting (except static files)
app.use('/auth', apiLimiter);
app.use('/api', apiLimiter);
app.use('/messages', apiLimiter);
app.use('/subscriptions', apiLimiter);

// ─── Session Configuration ──────────────────────────────────────────────────
// Use SQLite-backed session store in production to avoid MemoryStore warnings
// and support multi-restart persistence
const sessionDb = new Database(path.join(__dirname, 'data', 'sessions.db'));
app.use(session({
    store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 900000 } }),
    secret: sessionSecret || 'mystical-magic-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,  // Set to false to work both with HTTP and HTTPS proxy
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// View engine setup (serving HTML files)
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Make user available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/messages', messageRoutes);
app.use('/characters', characterRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/api', apiRoutes);
app.use('/sms', smsRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Legal pages (public, no auth required)
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});
app.get('/refund', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'refund.html'));
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') ||
        req.path.startsWith('/subscriptions/') || req.path.startsWith('/sms/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
        if (err) res.status(404).send('<h1>404 — Page Not Found</h1><p><a href="/">Go Home</a></p>');
    });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled error:', err.stack || err.message || err);

    // Don't leak stack traces in production
    const isDev = process.env.NODE_ENV !== 'production';

    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') ||
        req.path.startsWith('/subscriptions/') || req.path.startsWith('/sms/')) {
        return res.status(500).json({
            error: 'An unexpected error occurred. Please try again.',
            ...(isDev && { details: err.message })
        });
    }

    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'), (sendErr) => {
        if (sendErr) res.status(500).send('<h1>500 — Something went wrong</h1><p><a href="/">Go Home</a></p>');
    });
});

// ─── Process-Level Error Handlers ───────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.stack || err.message);
    // Give the server 1s to finish in-flight requests before exiting
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
    // Don't exit — just log. Most rejections are recoverable.
});

// ─── Start Server ────────────────────────────────────────────────────────────
db.initialize().then(() => {
    console.log('Database initialized successfully');
    app.listen(PORT, () => {
        console.log(`🌟 Mystical Messages server running on port ${PORT}`);
        console.log(`✨ Visit http://localhost:${PORT} to start the magic!`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app;