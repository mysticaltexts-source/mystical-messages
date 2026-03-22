# Pre-Launch Audit Fixes

## Phase 1 — Security Headers & Error Handling
- [x] Install helmet package
- [x] Add Helmet.js security headers to server.js
- [x] Add global 404 handler to server.js
- [x] Add global 500 error handler to server.js
- [x] Add uncaughtException / unhandledRejection process handlers

## Phase 2 — Input Validation
- [x] Add server-side email format regex validation in auth.js signup & login
- [x] Add server-side phone number E.164 / US format validation in auth.js signup
- [x] Add input sanitization helper (strip HTML from user input)

## Phase 3 — TCPA / SMS Compliance Fix
- [x] Add sms_opt_out column to users table in database.js
- [x] Fix STOP handler in lib/sms.js to update database (set sms_opt_out flag)
- [x] Add Twilio inbound SMS webhook route (routes/sms.js + register in server.js)
- [x] Guard sendSMS() to check opt-out status before sending

## Phase 4 — Security Hardening
- [x] Create .gitignore file (prevent .env from being committed)
- [x] Add SESSION_SECRET strength warning in server.js
- [x] Add DB indexes on foreign keys in database.js
- [x] Fix subscription cancel route to guard against stripeEnabled = false
- [x] Fix bcrypt import in api.js (uses 'bcrypt' but package is 'bcryptjs')

## Phase 5 — XSS Prevention
- [x] Add escapeHtml utility to public/js/app.js
- [x] Replace unsafe innerHTML assignments with safe alternatives in public/js/app.js

## Phase 6 — Final Verification
- [x] Run the server and confirm it starts without errors
- [x] Run verify-services.js to confirm all checks pass