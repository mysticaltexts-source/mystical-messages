# Mystical Messages - Railway Deployment Guide

## 🚀 Quick Start Deployment

This guide will walk you through deploying your Mystical Messages app to Railway in about 15-20 minutes.

---

## 📋 Prerequisites

Before you begin, make sure you have:

1. ✅ **GitHub Account** - Free at github.com
2. ✅ **Railway Account** - Free at railway.app (includes $5/month free tier)
3. ✅ **Twilio Account** - Free trial at twilio.com
4. ✅ **Stripe Account** - Free at stripe.com
5. ✅ **hCaptcha Account** - Free at hcaptcha.com
6. ✅ **Gmail Account** (for sending emails)

---

## 📦 Step 1: Push Code to GitHub

### Option A: Using GitHub CLI (Recommended if installed)
```bash
# Create a new GitHub repository
gh repo create mystical-messages --public --source=. --remote=origin

# Push to GitHub
git push -u origin master
```

### Option B: Manual GitHub Setup
1. Go to https://github.com/new
2. Repository name: `mystical-messages`
3. Make it **Public** (required for Railway free tier)
4. Click **Create repository**
5. Copy the repository URL
6. In your terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mystical-messages.git
git branch -M main
git push -u origin main
```

---

## 🔧 Step 2: Get Required API Keys

### 2.1 Twilio Setup (for SMS)
1. Go to https://console.twilio.com
2. Sign up for a free trial account
3. Get your credentials from the Dashboard:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click "Show" to reveal)
4. Get a **Phone Number**:
   - Go to "Phone Numbers" → "Buy a Number"
   - Select a US number (free for trial)
   - Copy the phone number in E.164 format (e.g., +1234567890)

### 2.2 Stripe Setup (for payments)
1. Go to https://dashboard.stripe.com/apikeys
2. Find your **Publishable key** (starts with pk_...)
3. Find your **Secret key** (starts with sk_...)
4. **IMPORTANT**: Use test keys for now!

### 2.3 hCaptcha Setup (for bot protection)
1. Go to https://dashboard.hcaptcha.com
2. Click "Register a new site"
3. Site name: `Mystical Messages`
4. Site type: Choose "Invisible" or "Checkbox"
5. Copy your **Site Key** and **Secret Key**

### 2.4 Gmail SMTP Setup (for emails)
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to https://myaccount.google.com/apppasswords
4. Create an app password:
   - App: "Mail"
   - Device: "Other" → name it "Mystical Messages"
5. Copy the 16-character password (use this instead of your regular password)

---

## 🚂 Step 3: Deploy to Railway

### 3.1 Create Railway Project
1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your `mystical-messages` repository
4. Railway will automatically detect it as a Node.js project
5. Click **"Deploy Now"**

### 3.2 Configure Environment Variables

Railway will build your app. Once it starts, you need to add environment variables:

1. Go to your project → **Settings** → **Variables**
2. Add each variable by clicking **"New Variable"**

#### Required Environment Variables:

```
SESSION_SECRET=your_random_secret_string_here
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password_here
HCAPTCHA_SITE_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HCAPTCHA_SECRET_KEY=0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NODE_ENV=production
PORT=3000
APP_URL=https://your-app-name.railway.app
```

#### How to Generate SESSION_SECRET:
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### How to Get APP_URL:
1. After deployment, Railway will provide a URL like `https://mystical-messages.up.railway.app`
2. Copy this URL and set it as `APP_URL`

### 3.3 Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-app-url.railway.app/api/stripe/webhook`
4. Events to listen to: `checkout.session.completed`
5. Click **"Add endpoint"**
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)
7. Add it to Railway as `STRIPE_WEBHOOK_SECRET`

### 3.4 Redeploy

After adding all environment variables:
1. Go to the **Deployments** tab
2. Click the **"Redeploy"** button on the latest deployment
3. Wait for the build to complete (~2-3 minutes)

---

## ✅ Step 4: Test Your Deployment

### 4.1 Basic Functionality Tests
1. Visit your Railway app URL
2. **Test Sign Up**: Create a new account
3. **Test Email Verification**: Check your email for verification link
4. **Test Login**: Log in with your credentials
5. **Test Onboarding**: Complete the character selection
6. **Test Dashboard**: Verify the dashboard loads correctly

### 4.2 SMS Test (Twilio Trial)
1. Add a child with your own phone number
2. Create a test message
3. Send it to verify SMS delivery works
4. **Note**: Twilio trial accounts can only send to verified numbers

### 4.3 Subscription Test (Stripe Test Mode)
1. Go to Settings → Subscription Plans
2. Click "Subscribe Now" on Monthly plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiration: any future date
5. CVC: any 3 digits
6. Complete the test checkout
7. Verify your subscription is activated

---

## 🌐 Step 5: Connect Your Custom Domain (Optional)

If you own `mysticaltexts.com`:

### 5.1 Configure Domain in Railway
1. Go to Railway → Settings → **Domains**
2. Click **"Add Domain"**
3. Enter: `mysticaltexts.com`
4. Railway will show you DNS records to add

### 5.2 Update DNS Settings
Go to your domain registrar (GoDaddy, Namecheap, etc.) and add:

**For the root domain (A record):**
```
Type: A
Name: @
Value: [Railway-provided IP address]
TTL: 300
```

**For www (CNAME record):**
```
Type: CNAME
Name: www
Value: [Railway-provided hostname]
TTL: 300
```

### 5.3 Update APP_URL
1. In Railway Variables, change `APP_URL` to `https://mysticaltexts.com`
2. Redeploy the app

---

## 🔍 Troubleshooting

### Build Fails
- Check that `package.json` has correct scripts
- Verify all dependencies are listed
- Check Railway build logs for errors

### App Crashes on Startup
- Verify all environment variables are set correctly
- Check Railway logs for specific error messages
- Ensure `SESSION_SECRET` is set

### SMS Not Sending
- Verify Twilio credentials are correct
- Check that phone number is in E.164 format (+1XXX...)
- For trial accounts, verify recipient number is added in Twilio console

### Email Not Sending
- Verify Gmail app password is correct (not regular password)
- Check that 2FA is enabled on Gmail account
- Verify SMTP settings: `smtp.gmail.com:587`

### Stripe Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is copied correctly
- Check that webhook URL is accessible
- Test webhook in Stripe dashboard

### Subscription Not Activating
- Verify Stripe keys are test keys (not live keys)
- Check that webhook endpoint is receiving events
- Review Stripe webhook logs

---

## 📊 Monitoring Your App

### View Logs
1. Go to Railway → your project
2. Click on the service
3. View real-time logs in the **Logs** tab

### Check Resource Usage
1. Railway provides $5/month free tier
2. Monitor CPU, memory, and bandwidth usage
3. Upgrade plan if needed for higher traffic

---

## 🔒 Security Best Practices

1. **Never commit API keys to GitHub** - Always use environment variables
2. **Use HTTPS** - Railway provides SSL certificates automatically
3. **Rotate secrets regularly** - Update API keys periodically
4. **Monitor logs** - Watch for suspicious activity
5. **Keep dependencies updated** - Run `npm audit fix` regularly

---

## 📈 Scaling Considerations

Your app is ready to scale! Railway automatically handles:
- Load balancing
- Horizontal scaling
- Database management (SQLite → PostgreSQL when needed)
- CDN for static assets

---

## 🎉 You're Live!

Your Mystical Messages app is now deployed and ready for users!

**Next Steps:**
1. Share your app with friends and family
2. Monitor user feedback
3. Iterate and improve features
4. Consider upgrading from test to live Stripe keys
5. Set up analytics (Google Analytics, etc.)

---

## 📞 Support

If you encounter issues:
- Railway docs: https://docs.railway.app
- Twilio docs: https://www.twilio.com/docs
- Stripe docs: https://stripe.com/docs
- hCaptcha docs: https://docs.hcaptcha.com

---

## 🔄 Updates and Maintenance

### Updating Your App
```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push

# Railway will auto-deploy on push
```

### Database Backups
- Railway automatically backs up SQLite database
- For production, consider upgrading to PostgreSQL

---

**Deployment time: ~20 minutes**
**Total cost: Free tier ($0/month)**
**Scale: 100+ users on free tier**

Good luck with your deployment! 🚀