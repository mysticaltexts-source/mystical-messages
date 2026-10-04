# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start Vite dev server
npm run build     # Production build → ./dist
npm run preview   # Preview production build locally
```

No test runner or linter is configured.

## Environment Variables

Create a `.env` file at the project root (not committed):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These are consumed by `src/lib/supabase.js` via `import.meta.env`.

Add `VITE_TEST_MODE=true` to skip Twilio SMS calls entirely during development (no charges). **Delete the variable entirely** (do not set it to empty or false) once Twilio brand/10DLC approval is received.

## Launch Day Checklist

### Payments (do when ready to take real payments)

1. **Remove the prelaunch intercept** in `src/App.jsx` around line 1377 — delete this line:
   ```js
   return; // prelaunch intercept — remove this block when payments go live
   ```
   Then commit, push, and redeploy.

### Twilio / SMS — DONE (brand/10DLC approved; live sends and scheduled sends confirmed working Oct 2026)

Kept for reference (e.g. if the project is rebuilt). `VITE_TEST_MODE` must stay deleted in Vercel.

**There are two Supabase projects.** The live app connects to `mysticaltexts-source/mystic...` (not "mysticaltexts -Claude v2.0"). All steps below apply to the **source project**.

2. **DELETE `VITE_TEST_MODE`** from Vercel → your project → Settings → Environment Variables (do not set it to false or empty — delete it entirely), then trigger a redeploy
3. **Set each character's Twilio sender number** in the `characters` table (`twilio_number` column, e.g. `+1XXXXXXXXXX`). `send-message` and `send-scheduled-messages` both send `From: character.twilio_number` — it is not hardcoded in either function
4. **Verify these secrets exist** in Supabase → Edge Functions → Secrets on the source project (they are already set — just confirm values are production, not test):
   - `TWILIO_ACCOUNT_SID` — production Account SID (starts with `AC`)
   - `TWILIO_AUTH_TOKEN` — production Auth Token
5. No redeploy is needed when only `twilio_number` values change (they are read from the database at send time)
6. Send a test message from the dashboard to confirm delivery

## Architecture

**Mystical Messages** lets parents send SMS messages from fictional characters (Santa, Tooth Fairy, Easter Bunny) to their own phone number.

### Key structural fact: monolithic App.jsx

All UI lives in `src/App.jsx` (~1569 lines). There is no router — navigation is manual state: `const [screen, setScreen] = useState("auth")`. Each screen is a separate function component defined inside the file and rendered by the top-level `App` based on the current `screen` value.

**Screens:** `auth` → `setup` → `dashboard` | `billing` | `child-profile` | `history` | `schedule` | `about` | `terms`

The files under `src/components/Footer` and `src/pages/About|Terms` are legacy remnants from a previous React Router architecture and are **not used**.

### Styling

All styling is inline CSS. Color and spacing tokens live in a constant `T` at the top of `App.jsx`:

```js
const T = { midnight: "#0d1b2a", navy: "#132233", parchment: "#fdf8f0", gold: "#c9933a", ... }
```

Always use `T.*` values rather than raw hex. There are no CSS files, no CSS modules, no Tailwind.

### Shared UI primitives (defined in App.jsx)

- `Btn(label, onClick, opts)` — variants: `primary`, `ghost`, `outline`, `danger`
- `Input(label, value, onChange, opts)` — standard labeled form input
- `Card(children, opts)` — container with consistent padding/radius
- `Toast` — notification shown at bottom of screen
- `Spinner` — loading indicator
- `Stars` — animated starfield background
- `PageNav` — top navigation bar with back button
- `Footer` — bottom links

Use these before creating new components.

### Supabase integration (`src/lib/supabase.js`)

The file exports:
- `supabase` — configured Supabase client
- `callFunction(name, body)` — thin wrapper around `supabase.functions.invoke()` used to call Edge Functions

**Database tables:** `profiles`, `children`, `messages`, `characters`

Auth is email/password via `supabase.auth`. Row-level security is enforced server-side. Always use the authenticated client — do not pass auth tokens manually.

Edge Functions handle SMS delivery (`send-message`) and Stripe checkout (`create-checkout-session`). These run in Supabase's Deno runtime, not in this repo.

**Scheduled messages:** the Schedule screen saves rows with `status = 'scheduled'` and `scheduled_for` (UTC). The `send-scheduled-messages` Edge Function, triggered every minute by `pg_cron` (authenticated with its own `SCHEDULER_SECRET`), claims due rows via `claim_due_messages()` (scheduled → sending), re-checks the content filter, expired-trial block, character plan and phone number, sends via Twilio, and marks the same row `sent` or `failed`. Failures are never auto-retried. Rows over 6 hours late are marked failed ("missed"). `FLAGGED_TERMS` is duplicated in that function — keep it in sync with `App.jsx`. Setup SQL: `supabase/migrations/20261004000000_scheduled_sender.sql`, then `supabase/scheduled_sender_cron.sql` (run by hand; needs your project values).

### Plan system

Plans gate feature access throughout the app. Rank order:

```js
const PLAN_RANK = { free: 0, trial: 1, basic: 2, standard: 3, premium: 4 }
```

Check `profile.plan` against `PLAN_RANK` when gating UI. Stripe price IDs are hard-coded in `App.jsx` as `STRIPE_PRICES`.

### Deployment

Deployed to Vercel. `vercel.json` configures build/output; no special handling needed beyond `npm run build`.
