-- Summit - auth maison pseudo + mot de passe
-- À exécuter après 0001_init.sql.

create extension if not exists pgcrypto with schema extensions;

-- Les données Summit utilisent désormais un profil maison, pas auth.users.
alter table public.daily_logs drop constraint if exists daily_logs_user_id_fkey;
alter table public.settings drop constraint if exists settings_user_id_fkey;
alter table public.push_subscriptions drop constraint if exists push_subscriptions_user_id_fkey;

create table if not exists public.summit_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  pseudo text not null unique,
  display_pseudo text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.summit_sessions (
  token text primary key,
  profile_id uuid not null references public.summit_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '365 days')
);

alter table public.summit_profiles enable row level security;
alter table public.summit_sessions enable row level security;

create or replace function public.summit_normalize_pseudo(raw_pseudo text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(trim(raw_pseudo)), '[^a-z0-9_-]+', '-', 'g'));
$$;

create or replace function public.summit_profile_for_token(session_token text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select profile_id
  from public.summit_sessions
  where token = session_token
    and expires_at > now()
  limit 1;
$$;

create or replace function public.summit_start_session(profile uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.summit_sessions (token, profile_id)
  values (new_token, profile);
  return new_token;
end;
$$;

create or replace function public.summit_signup(raw_pseudo text, raw_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  profile_id uuid;
  session_token text;
begin
  normalized := public.summit_normalize_pseudo(raw_pseudo);

  if length(normalized) < 2 then
    raise exception 'Pseudo trop court';
  end if;

  if length(raw_password) < 6 then
    raise exception 'Mot de passe trop court';
  end if;

  insert into public.summit_profiles (pseudo, display_pseudo, password_hash)
  values (normalized, trim(raw_pseudo), extensions.crypt(raw_password, extensions.gen_salt('bf')))
  returning id into profile_id;

  session_token := public.summit_start_session(profile_id);

  return jsonb_build_object(
    'token', session_token,
    'profile', jsonb_build_object('id', profile_id, 'pseudo', trim(raw_pseudo))
  );
exception
  when unique_violation then
    raise exception 'Pseudo déjà utilisé';
end;
$$;

create or replace function public.summit_signin(raw_pseudo text, raw_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  profile record;
  session_token text;
begin
  normalized := public.summit_normalize_pseudo(raw_pseudo);

  select id, display_pseudo, password_hash
  into profile
  from public.summit_profiles
  where pseudo = normalized
  limit 1;

  if not found or profile.password_hash <> extensions.crypt(raw_password, profile.password_hash) then
    raise exception 'Pseudo ou mot de passe incorrect';
  end if;

  session_token := public.summit_start_session(profile.id);

  return jsonb_build_object(
    'token', session_token,
    'profile', jsonb_build_object('id', profile.id, 'pseudo', profile.display_pseudo)
  );
end;
$$;

create or replace function public.summit_signout(session_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.summit_sessions where token = session_token;
$$;

create or replace function public.summit_pull(session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  settings_row record;
  profile_row record;
begin
  profile_id := public.summit_profile_for_token(session_token);
  if profile_id is null then
    raise exception 'Session invalide';
  end if;

  select id, display_pseudo into profile_row from public.summit_profiles where id = profile_id;
  select data, updated_at into settings_row from public.settings where user_id = profile_id;

  return jsonb_build_object(
    'profile', jsonb_build_object('id', profile_row.id, 'pseudo', profile_row.display_pseudo),
    'settings', case
      when settings_row.data is null then null
      else jsonb_build_object('data', settings_row.data, 'updated_at', settings_row.updated_at)
    end,
    'daily_logs', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'date', date,
          'tasks', tasks,
          'sport_blocks', sport_blocks,
          'updated_at', updated_at
        ))
        from public.daily_logs
        where user_id = profile_id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.summit_push(
  session_token text,
  settings_payload jsonb,
  settings_updated_at bigint,
  logs_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  item jsonb;
begin
  profile_id := public.summit_profile_for_token(session_token);
  if profile_id is null then
    raise exception 'Session invalide';
  end if;

  if settings_payload is not null then
    insert into public.settings (user_id, data, updated_at)
    values (profile_id, settings_payload, settings_updated_at)
    on conflict (user_id) do update
      set data = excluded.data,
          updated_at = excluded.updated_at
      where public.settings.updated_at <= excluded.updated_at;
  end if;

  for item in select * from jsonb_array_elements(coalesce(logs_payload, '[]'::jsonb))
  loop
    insert into public.daily_logs (user_id, date, tasks, sport_blocks, updated_at)
    values (
      profile_id,
      item->>'date',
      coalesce(item->'tasks', '{}'::jsonb),
      coalesce((item->>'sport_blocks')::int, 0),
      coalesce((item->>'updated_at')::bigint, 0)
    )
    on conflict (user_id, date) do update
      set tasks = excluded.tasks,
          sport_blocks = excluded.sport_blocks,
          updated_at = excluded.updated_at
      where public.daily_logs.updated_at <= excluded.updated_at;
  end loop;
end;
$$;

create or replace function public.summit_upsert_push_subscription(
  session_token text,
  endpoint_value text,
  subscription_payload jsonb,
  tz_offset_value int,
  updated_at_value bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
begin
  profile_id := public.summit_profile_for_token(session_token);
  if profile_id is null then
    raise exception 'Session invalide';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, subscription, tz_offset, updated_at)
  values (profile_id, endpoint_value, subscription_payload, tz_offset_value, updated_at_value)
  on conflict (user_id, endpoint) do update
    set subscription = excluded.subscription,
        tz_offset = excluded.tz_offset,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.summit_delete_push_subscription(session_token text, endpoint_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
begin
  profile_id := public.summit_profile_for_token(session_token);
  if profile_id is null then
    raise exception 'Session invalide';
  end if;

  delete from public.push_subscriptions
  where user_id = profile_id
    and endpoint = endpoint_value;
end;
$$;

grant execute on function public.summit_signup(text, text) to anon, authenticated;
grant execute on function public.summit_signin(text, text) to anon, authenticated;
grant execute on function public.summit_signout(text) to anon, authenticated;
grant execute on function public.summit_pull(text) to anon, authenticated;
grant execute on function public.summit_push(text, jsonb, bigint, jsonb) to anon, authenticated;
grant execute on function public.summit_upsert_push_subscription(text, text, jsonb, int, bigint) to anon, authenticated;
grant execute on function public.summit_delete_push_subscription(text, text) to anon, authenticated;
