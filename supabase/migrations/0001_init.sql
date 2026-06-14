-- Summit - schéma initial (sauvegarde cloud + abonnements push)
-- À exécuter dans Supabase : SQL Editor, ou via `supabase db push`.

-- Logs quotidiens (1 ligne par user et par jour)
create table if not exists public.daily_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  tasks jsonb not null default '{}'::jsonb,
  sport_blocks int not null default 0,
  updated_at bigint not null default 0,
  primary key (user_id, date)
);

-- Réglages (1 ligne par user, payload JSON)
create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at bigint not null default 0
);

-- Abonnements Web Push (1 ligne par appareil)
create table if not exists public.push_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  tz_offset int not null default 0, -- minutes à ajouter à UTC pour l'heure locale
  updated_at bigint not null default 0,
  primary key (user_id, endpoint)
);

-- Row Level Security : chaque utilisateur ne voit que ses données.
alter table public.daily_logs enable row level security;
alter table public.settings enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "logs_owner" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings_owner" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subs_owner" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
