# Mystical Messages — Invite Code Management

## Platform
**Supabase** → https://supabase.com
Log in → select project **mysticaltexts-source/mystic…** (the live project, not "Claude v2.0")

---

## Getting to the codes table

**Menu path:**
`Table Editor` (left sidebar) → `invite_codes`

You'll see a spreadsheet-style view of all your codes.

---

## Field reference

| Field | What it is | Notes |
|---|---|---|
| `code` | The code users type in | Always uppercase, no spaces. Must be unique. |
| `plan` | What plan the code grants | Options: `trial` `basic` `standard` `premium` |
| `max_uses` | How many times the code can be redeemed | Leave blank for unlimited |
| `uses` | How many times it's been redeemed so far | Auto-tracked — don't edit this |
| `expires_at` | Optional expiry date | Leave blank for no expiry. Format: `2025-12-31 23:59:00` |
| `note` | Your private reference note | Not visible to users. Use it to track who got what. |
| `created_at` | Auto-set when you create the row | Don't edit |

---

## Creating a new code

1. Open `Table Editor` → `invite_codes`
2. Click **Insert** → **Insert row** (top right)
3. Fill in:
   - `code` — e.g. `SARAH2025` or `HOLIDAYPREVIEW`
   - `plan` — type exactly: `trial`, `basic`, `standard`, or `premium`
   - `max_uses` — a number, or leave blank for unlimited
   - `expires_at` — a date, or leave blank
   - `note` — e.g. `Given to Sarah H. — influencer preview`
   - Leave `uses` and `created_at` blank (auto-filled)
4. Click **Save**

---

## Editing an existing code

1. Open `Table Editor` → `invite_codes`
2. Click the row you want to change
3. Edit the field directly
4. Click **Save**

Common edits:
- **Cap a previously unlimited code** → set `max_uses` to a number
- **Extend or add an expiry** → edit `expires_at`
- **Change the plan level** → edit `plan`

---

## Deactivating a code

Two ways:

- **Set it to expire immediately** → set `expires_at` to any past date/time (e.g. `2020-01-01`)
- **Set max uses to the current uses count** → if `uses` is 3, set `max_uses` to 3. No one else can redeem it.

---

## Checking usage

In `Table Editor` → `invite_codes`, the `uses` column shows how many times each code has been redeemed. Compare against `max_uses` to see how many redemptions are left.

For a full audit of who redeemed what, you can cross-reference in `Table Editor` → `profiles` — filter by `plan` and `created_at` to see when accounts were upgraded.

---

## Quick SQL (optional — for power users)

If you prefer, you can manage codes directly in **SQL Editor** (left sidebar):

**Add a new code:**
```sql
insert into invite_codes (code, plan, max_uses, note)
values ('YOURCODE', 'standard', 10, 'Your note here');
```

**Deactivate a code:**
```sql
update invite_codes set expires_at = now() where code = 'YOURCODE';
```

**See all codes and usage:**
```sql
select code, plan, uses, max_uses, expires_at, note
from invite_codes
order by created_at desc;
```

---

## Your starter codes

| Code | Plan | Max Uses | Note |
|---|---|---|---|
| `MAGIC2025` | standard | unlimited | General preview |
| `EARLYBIRD` | standard | 50 | Early bird batch |
