-- ============================================================
--  Scheduled message sender — the every-minute trigger
--  NOT a migration: it needs your project's own values, so run it by hand
--  in Supabase → SQL Editor on the SOURCE project, AFTER:
--    1. Database → Extensions: enable  pg_cron  and  pg_net
--    2. Deploying the send-scheduled-messages Edge Function
--    3. Replacing the three <PLACEHOLDERS> below
--       (CRON_SECRET must equal the CRON_SECRET in Edge Functions → Secrets;
--        ANON_KEY is the project's anon/public key)
-- ============================================================

select vault.create_secret('<PROJECT_ID>',  'sched_project_id');
select vault.create_secret('<ANON_KEY>',    'sched_anon_key');
select vault.create_secret('<CRON_SECRET>', 'sched_cron_secret');

select cron.schedule(
  'send-scheduled-messages',
  '* * * * *',   -- every minute
  $$
  select net.http_post(
    url := 'https://' || (select decrypted_secret from vault.decrypted_secrets where name = 'sched_project_id')
           || '.supabase.co/functions/v1/send-scheduled-messages',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sched_anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sched_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To pause:  select cron.unschedule('send-scheduled-messages');
