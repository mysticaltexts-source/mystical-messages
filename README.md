# 🔮 Mystical Messages

A magical SMS messaging service that allows parents to send personalized, character-themed messages to their children. Built with Node.js, Express, and deployed on Railway.

---

## ✨ Features

- 🎨 **12 Magical Characters** - Wizard, Fairy, Elf, Mermaid, Dragon, Unicorn, and more
- 📱 **SMS Delivery** - Powered by Twilio
- 💳 **Subscription Plans** - Monthly and yearly plans with Stripe
- 📧 **Email Notifications** - Via Gmail SMTP
- 🛡️ **Secure Authentication** - Session-based with hCaptcha protection
- 📅 **Message Scheduling** - Send now or schedule for later
- 💾 **Save Templates** - Reuse your favorite message scripts
- 👨‍👩‍👧 **Multiple Children** - Manage multiple children profiles
- 🔒 **Privacy Focused** - TCPA compliant, secure data handling

---

## 🚀 Quick Start

### 1. Get the Code

The code is ready in `/workspace/mystical-messages/` and has been initialized as a Git repository.

### 2. Push to GitHub

```bash
# Create a GitHub repository at github.com/new
# Name: mystical-messages
# Make it Public

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/mystical-messages.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `mystical-messages` repository
4. Click "Deploy Now"

### 4. Configure Environment Variables

After deployment, add these variables in Railway Settings:

```bash
SESSION_SECRET=your_random_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
HCAPTCHA_SITE_KEY=your_site_key
HCAPTCHA_SECRET_KEY=your_secret_key
NODE_ENV=production
PORT=3000
APP_URL=https://your-app.railway.app
```

### 5. Test Your App

- Visit your Railway URL
- Sign up for an account
- Complete onboarding
- Send your first magical message!

---

## 📋 Detailed Deployment Guide

For step-by-step instructions, see:
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Track your progress
- **[ENV_TEMPLATE.txt](ENV_TEMPLATE.txt)** - Environment variable template

---

## 🛠️ Tech Stack

### Backend
- **Node.js 18** - Runtime environment
- **Express.js** - Web framework
- **SQLite (better-sqlite3)** - Database with WAL mode
- **better-sqlite3-session-store** - Session management
- **Helmet.js** - Security headers
- **express-rate-limit** - Rate limiting
- **bcrypt** - Password hashing

### Integrations
- **Twilio** - SMS delivery
- **Stripe** - Payment processing
- **Nodemailer** - Email delivery
- **hCaptcha** - Bot protection

### Frontend
- **Vanilla JavaScript** - No frameworks needed
- **HTML5/CSS3** - Modern responsive design
- **Tailwind-like utilities** - Custom CSS utility classes

### Deployment
- **Railway** - Cloud platform
- **Docker** - Containerization
- **GitHub** - Version control

---

## 📁 Project Structure

```
mystical-messages/
├── server.js                 # Main application server
├── package.json              # Dependencies and scripts
├── Dockerfile                # Railway deployment configuration
├── .gitignore                # Git ignore rules
├── todo.md                   # Development todo list
│
├── routes/                   # API routes
│   ├── api.js               # General API endpoints
│   ├── auth.js              # Authentication routes
│   ├── characters.js        # Character data
│   ├── dashboard.js         # Dashboard endpoints
│   ├── messages.js          # Message creation/sending
│   ├── sms.js               # SMS handling
│   └── subscriptions.js     # Stripe integration
│
├── models/                   # Data models
│   └── database.js          # SQLite database schema
│
├── middleware/               # Express middleware
│   └── protection.js        # Rate limiting & security
│
├── lib/                      # Helper libraries
│   ├── mailer.js            # Email functions
│   └── sms.js               # SMS functions
│
├── views/                    # HTML templates
│   ├── index.html           # Landing page
│   ├── login.html           # Login form
│   ├── signup.html          # Registration form
│   ├── dashboard.html       # Main dashboard
│   ├── message-create.html  # Message creation wizard
│   ├── message-history.html # Conversation history
│   ├── settings.html        # User settings
│   └── ... (18 total files)
│
├── public/                   # Static assets
│   ├── css/
│   │   └── styles.css       # Main stylesheet
│   ├── js/
│   │   └── app.js           # Frontend JavaScript
│   └── images/
│       ├── logo.svg         # App logo
│       └── *.svg            # Character icons (8 files)
│
├── DEPLOYMENT_GUIDE.md      # Step-by-step deployment guide
├── DEPLOYMENT_CHECKLIST.md  # Deployment progress tracker
├── ENV_TEMPLATE.txt         # Environment variable template
└── README.md                # This file
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SESSION_SECRET` | Random secret for sessions | ✅ Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | ✅ Yes |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | ✅ Yes |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164) | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ Yes |
| `EMAIL_HOST` | SMTP host (e.g., smtp.gmail.com) | ✅ Yes |
| `EMAIL_USER` | Email address for sending | ✅ Yes |
| `EMAIL_PASS` | Email password (or app password) | ✅ Yes |
| `HCAPTCHA_SITE_KEY` | hCaptcha site key | ✅ Yes |
| `HCAPTCHA_SECRET_KEY` | hCaptcha secret key | ✅ Yes |
| `NODE_ENV` | Environment (production/development) | ✅ Yes |
| `PORT` | Server port | ✅ Yes |
| `APP_URL` | Your application URL | ✅ Yes |

---

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Session Management** - Secure session store
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **CSRF Protection** - Form token validation
- ✅ **XSS Prevention** - Input sanitization
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **Security Headers** - Helmet.js middleware
- ✅ **Bot Protection** - hCaptcha integration
- ✅ **TCPA Compliance** - SMS opt-out tracking

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/resend-verification` - Resend email verification

### Messages
- `GET /api/characters` - Get available characters
- `GET /api/templates` - Get message templates
- `GET /api/children` - Get user's children
- `POST /api/messages/send` - Send message
- `GET /api/conversations` - Get conversation history
- `GET /api/conversations/:id` - Get specific conversation

### Subscriptions
- `GET /api/user/subscription` - Get subscription status
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/subscription-cancel` - Cancel subscription

### Settings
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `POST /api/children` - Add child
- `DELETE /api/children/:id` - Remove child
- `DELETE /api/user/account` - Delete account

---

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication
- [x] Character selection
- [x] SMS messaging
- [x] Email notifications
- [x] Basic dashboard

### Phase 2: Enhanced Features ✅
- [x] Subscription plans
- [x] Payment processing
- [x] Message scheduling
- [x] Saved templates
- [x] Multiple children

### Phase 3: Polish & Deploy ✅
- [x] Responsive design
- [x] Error handling
- [x] Security hardening
- [x] Railway deployment
- [x] Documentation

### Phase 4: Future Enhancements 🚀
- [ ] Push notifications
- [ ] Message analytics
- [ ] A/B testing
- [ ] Advanced scheduling
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support
- [ ] Custom character creation
- [ ] Voice messages

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For deployment help:
- **Railway Docs:** https://docs.railway.app
- **Twilio Docs:** https://www.twilio.com/docs
- **Stripe Docs:** https://stripe.com/docs

---

## 🎉 Acknowledgments

Built with ❤️ using modern web technologies. Special thanks to the open-source community for the amazing tools and libraries that make this project possible.

---

**Ready to deploy? Check out [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to get started! 🚀**