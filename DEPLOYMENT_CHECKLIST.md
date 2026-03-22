# 🚀 Mystical Messages - Deployment Checklist

Use this checklist to track your deployment progress. Check off each item as you complete it.

---

## 📦 Phase 1: Prepare & Push Code

- [ ] **Initialize Git repository** ✅ (Done)
- [ ] **Commit all files** ✅ (Done - 40 files committed)
- [ ] **Create GitHub repository** 
  - Go to https://github.com/new
  - Name: `mystical-messages`
  - Make it **Public**
  - Click "Create repository"
- [ ] **Push code to GitHub**
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/mystical-messages.git
  git branch -M main
  git push -u origin main
  ```

---

## 🔑 Phase 2: Get API Keys & Credentials

### Twilio (SMS)
- [ ] **Create Twilio account** - https://console.twilio.com
- [ ] **Get Account SID** - From Dashboard
- [ ] **Get Auth Token** - From Dashboard (click "Show")
- [ ] **Get Phone Number** - Buy free trial number in E.164 format

### Stripe (Payments)
- [ ] **Create Stripe account** - https://dashboard.stripe.com
- [ ] **Get Publishable Key** - From API Keys page (pk_test_...)
- [ ] **Get Secret Key** - From API Keys page (sk_test_...)
- [ ] **Set up Webhook** - Endpoint: `/api/stripe/webhook`
- [ ] **Get Webhook Secret** - From webhook settings (whsec_...)

### Gmail (Email)
- [ ] **Enable 2FA on Gmail** - Account settings → Security
- [ ] **Create App Password** - https://myaccount.google.com/apppasswords
  - App: "Mail"
  - Device: "Other" → "Mystical Messages"
- [ ] **Copy App Password** - 16-character password

### hCaptcha (Bot Protection)
- [ ] **Create hCaptcha account** - https://dashboard.hcaptcha.com
- [ ] **Register new site** - Name: "Mystical Messages"
- [ ] **Get Site Key** - From site settings
- [ ] **Get Secret Key** - From site settings

### Generate Secrets
- [ ] **Generate SESSION_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## 🚂 Phase 3: Deploy to Railway

### Initial Deployment
- [ ] **Create Railway account** - https://railway.app
- [ ] **Create new project** - Click "New Project"
- [ ] **Connect GitHub repo** - Select `mystical-messages`
- [ ] **Deploy** - Click "Deploy Now"
- [ ] **Wait for build** - Takes 2-3 minutes

### Configure Environment Variables
- [ ] **Go to Settings → Variables**
- [ ] **Add SESSION_SECRET**
- [ ] **Add TWILIO_ACCOUNT_SID**
- [ ] **Add TWILIO_AUTH_TOKEN**
- [ ] **Add TWILIO_PHONE_NUMBER**
- [ ] **Add STRIPE_SECRET_KEY**
- [ ] **Add STRIPE_PUBLISHABLE_KEY**
- [ ] **Add STRIPE_WEBHOOK_SECRET**
- [ ] **Add EMAIL_HOST** (smtp.gmail.com)
- [ ] **Add EMAIL_USER** (your email)
- [ ] **Add EMAIL_PASS** (app password)
- [ ] **Add HCAPTCHA_SITE_KEY**
- [ ] **Add HCAPTCHA_SECRET_KEY**
- [ ] **Add NODE_ENV** (production)
- [ ] **Add PORT** (3000)
- [ ] **Add APP_URL** (your Railway URL)
- [ ] **Redeploy** - Click "Redeploy" button

---

## ✅ Phase 4: Test Your Deployment

### Basic Tests
- [ ] **Visit app URL** - Verify page loads
- [ ] **Test Sign Up** - Create new account
- [ ] **Test Email Verification** - Check email inbox
- [ ] **Test Login** - Log in with credentials
- [ ] **Test Onboarding** - Complete character selection
- [ ] **Test Dashboard** - Verify dashboard works

### SMS Test
- [ ] **Add child** - Use your own phone number
- [ ] **Create message** - Write test message
- [ ] **Send message** - Verify SMS delivery
- [ ] **Check message history** - Verify it appears in history

### Payment Test
- [ ] **Go to Settings → Plans**
- [ ] **Click "Subscribe"** - Select Monthly plan
- [ ] **Use test card** - 4242 4242 4242 4242
- [ ] **Complete checkout** - Any future date, any CVC
- [ ] **Verify subscription** - Check Settings page

### Full User Flow
- [ ] **Create message with scheduling**
- [ ] **Test message templates**
- [ ] **Save custom script**
- [ ] **Test child management**
- [ ] **Test profile updates**

---

## 🌐 Phase 5: Configure Custom Domain (Optional)

- [ ] **Purchase domain** - mysticaltexts.com (if not owned)
- [ ] **Go to Railway → Settings → Domains**
- [ ] **Add domain** - Enter `mysticaltexts.com`
- [ ] **Copy DNS records** - Get A record and CNAME from Railway
- [ ] **Update DNS** - Go to domain registrar (GoDaddy, Namecheap, etc.)
- [ ] **Add A record** - @ → [Railway IP]
- [ ] **Add CNAME record** - www → [Railway hostname]
- [ ] **Wait for propagation** - 5-30 minutes
- [ ] **Update APP_URL** - Change to https://mysticaltexts.com
- [ ] **Redeploy** - Click "Redeploy"
- [ ] **Test custom domain** - Visit mysticaltexts.com

---

## 🔒 Phase 6: Security & Production Setup

### Security Checks
- [ ] **Verify HTTPS** - Check SSL certificate works
- [ ] **Test rate limiting** - Verify protection works
- [ ] **Check SQL injection protection** - Verify database security
- [ ] **Test XSS protection** - Verify input sanitization
- [ ] **Review logs** - Check for any security issues

### Production Setup
- [ ] **Switch Stripe to live keys** (when ready for real payments)
  - Get live keys from Stripe dashboard
  - Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
  - Redeploy
- [ ] **Upgrade Twilio account** (when ready for production SMS)
  - Add real phone numbers
  - Update billing
- [ ] **Set up monitoring** - Configure error tracking
- [ ] **Set up analytics** - Add Google Analytics
- [ ] **Configure backups** - Set up automated backups

---

## 📊 Phase 7: Launch Preparation

### Final Checks
- [ ] **Test all features end-to-end**
- [ ] **Verify email delivery** - Test all email notifications
- [ ] **Test SMS delivery** - Verify messages arrive correctly
- [ ] **Test payment flow** - Complete full purchase
- [ ] **Check mobile responsiveness** - Test on phone
- [ ] **Verify all pages load** - Check 404, 500 error pages

### Launch Tasks
- [ ] **Tell friends and family**
- [ ] **Share on social media**
- [ ] **Monitor first 24 hours**
- [ ] **Check logs regularly**
- [ ] **Respond to user feedback**

---

## 🎉 Deployment Complete!

**Time Estimate:** 20-30 minutes
**Cost:** Free tier ($0/month)
**Ready for:** 100+ users

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Twilio Docs:** https://www.twilio.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **hCaptcha Docs:** https://docs.hcaptcha.com

---

## 🔄 Post-Launch Maintenance

### Weekly Tasks
- [ ] Check app logs for errors
- [ ] Monitor usage statistics
- [ ] Review user feedback
- [ ] Test critical features

### Monthly Tasks
- [ ] Review and update dependencies
- [ ] Check security vulnerabilities
- [ ] Analyze performance metrics
- [ ] Plan feature improvements

### Quarterly Tasks
- [ ] Review and rotate API keys
- [ ] Audit security settings
- [ ] Evaluate scaling needs
- [ ] Update documentation

---

**Good luck with your deployment! 🚀**