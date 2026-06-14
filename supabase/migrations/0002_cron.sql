-- Summit - planification des rappels push.
-- À exécuter APRÈS avoir déployé la fonction Edge `send-reminders`
-- (et après avoir mis verify_jwt = false + le secret CRON_SECRET sur la fonction).
-- Remplace <CRON_SECRET> par la valeur réelle avant d'exécuter (NE PAS committer la vraie valeur).
-- Une copie locale prête à l'emploi se trouve dans 0002_cron.local.sql (non versionné).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Toutes les 15 minutes, déclenche la fonction qui envoie les rappels dus.
select
  cron.schedule(
    'summit-send-reminders',
    '*/15 * * * *',
    $$
    select net.http_post(
      url := 'https://zqewmuywqyxpsusgvhlp.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', '<CRON_SECRET>'
      ),
      body := '{}'::jsonb
    );
    $$
  );

-- Pour annuler la planification :
--   select cron.unschedule('summit-send-reminders');
--
-- Pour tester un envoi immédiat (à coller dans le SQL Editor) :
--   select net.http_post(
--     url := 'https://zqewmuywqyxpsusgvhlp.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := '{}'::jsonb
--   );
