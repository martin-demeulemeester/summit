-- Summit - durcissement de l'auth maison.
-- À exécuter APRÈS 0003_custom_auth.sql (idempotent : CREATE OR REPLACE).
-- Apporte : anti-brute-force (signin), throttling (signup), purge des sessions
-- expirées, sessions plus courtes.

-- 1. Table de comptage des tentatives (rate limiting).
create table if not exists public.summit_auth_attempts (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.summit_auth_attempts enable row level security;
-- Aucune policy : table interne, accessible uniquement via les fonctions SECURITY DEFINER.

-- 2. Garde générique de rate limiting.
--    Lève une exception si la clé est verrouillée ou dépasse le quota dans la fenêtre.
create or replace function public.summit_rate_limit(
  attempt_key text,
  max_count int,
  window_seconds int,
  lock_seconds int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.summit_auth_attempts;
begin
  select * into row from public.summit_auth_attempts where key = attempt_key for update;

  if found and row.locked_until is not null and row.locked_until > now() then
    raise exception 'Trop de tentatives. Réessaie plus tard.';
  end if;

  if not found then
    insert into public.summit_auth_attempts (key, count, window_start)
    values (attempt_key, 1, now());
    return;
  end if;

  -- Fenêtre expirée -> on repart à zéro.
  if row.window_start + make_interval(secs => window_seconds) < now() then
    update public.summit_auth_attempts
      set count = 1, window_start = now(), locked_until = null
      where key = attempt_key;
    return;
  end if;

  -- Dans la fenêtre : incrémente et verrouille si dépassement.
  if row.count + 1 > max_count then
    update public.summit_auth_attempts
      set count = row.count + 1, locked_until = now() + make_interval(secs => lock_seconds)
      where key = attempt_key;
    raise exception 'Trop de tentatives. Réessaie plus tard.';
  end if;

  update public.summit_auth_attempts set count = row.count + 1 where key = attempt_key;
end;
$$;

-- Réinitialise le compteur d'une clé (après un succès).
create or replace function public.summit_rate_reset(attempt_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.summit_auth_attempts where key = attempt_key;
$$;

-- 3. Sessions plus courtes (90 jours au lieu de 365).
alter table public.summit_sessions
  alter column expires_at set default (now() + interval '90 days');

-- Purge des sessions expirées (à planifier via pg_cron, ex. quotidien).
create or replace function public.summit_cleanup_sessions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.summit_sessions where expires_at < now();
$$;

-- 4. signup avec throttling global (anti-spam de comptes).
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
  -- Max 30 créations de compte par heure (tous comptes confondus).
  perform public.summit_rate_limit('signup', 30, 3600, 3600);

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

-- 5. signin avec anti-brute-force par pseudo (5 essais / 15 min, verrou 15 min).
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
  attempt_key text;
begin
  normalized := public.summit_normalize_pseudo(raw_pseudo);
  attempt_key := 'signin:' || normalized;

  perform public.summit_rate_limit(attempt_key, 5, 900, 900);

  select id, display_pseudo, password_hash
  into profile
  from public.summit_profiles
  where pseudo = normalized
  limit 1;

  if not found or profile.password_hash <> extensions.crypt(raw_password, profile.password_hash) then
    raise exception 'Pseudo ou mot de passe incorrect';
  end if;

  -- Succès : on efface le compteur de tentatives.
  perform public.summit_rate_reset(attempt_key);

  session_token := public.summit_start_session(profile.id);

  return jsonb_build_object(
    'token', session_token,
    'profile', jsonb_build_object('id', profile.id, 'pseudo', profile.display_pseudo)
  );
end;
$$;

-- Les fonctions signup/signin restent appelables par anon (grants de 0003 conservés).
grant execute on function public.summit_cleanup_sessions() to anon, authenticated;
