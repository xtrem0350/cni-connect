-- =====================================================================
-- Retrouve CNI 2026 — Schéma complet
-- À exécuter dans le SQL Editor de votre projet Supabase
-- (https://xpbgvjebnulugeisonju.supabase.co → SQL Editor → New query)
-- =====================================================================

-- ---------- PROFILS -------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text,
  telephone text,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profils lisibles par le proprietaire" on public.profiles;
create policy "profils lisibles par le proprietaire" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profil modifiable par le proprietaire" on public.profiles;
create policy "profil modifiable par le proprietaire" on public.profiles
  for update to authenticated using (auth.uid() = id);

drop policy if exists "profil creable par le proprietaire" on public.profiles;
create policy "profil creable par le proprietaire" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom, telephone)
  values (new.id, new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'telephone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- DECLARATIONS --------------------------------------------
do $$ begin
  create type declaration_type as enum ('perdu', 'trouve');
exception when duplicate_object then null; end $$;

create table if not exists public.declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type declaration_type not null,
  type_document text not null default 'CNI',
  numero_hash text,
  nom text,
  prenom text,
  nom_porteur text,
  date_naissance date not null,
  lieu_naissance text not null,
  date_delivrance date not null,
  lieu_perte_trouvaille text,
  description text,
  commentaire text,
  statut text not null default 'actif',    -- actif | resolu | archive
  last_matched_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.declarations
  add column if not exists numero_hash text,
  add column if not exists nom text,
  add column if not exists prenom text,
  add column if not exists nom_porteur text,
  add column if not exists description text,
  add column if not exists type_document text default 'CNI';

alter table public.declarations
  alter column numero_hash drop not null;

create index if not exists idx_declarations_match
  on public.declarations (date_naissance, lieu_naissance, date_delivrance);
create index if not exists idx_declarations_user on public.declarations (user_id);
create index if not exists idx_declarations_statut on public.declarations (statut);

grant select, insert, update on public.declarations to authenticated;
grant all on public.declarations to service_role;
alter table public.declarations enable row level security;

drop policy if exists "declarations lisibles par le proprietaire" on public.declarations;
create policy "declarations lisibles par le proprietaire" on public.declarations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "declarations creables par le proprietaire" on public.declarations;
create policy "declarations creables par le proprietaire" on public.declarations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "declarations modifiables par le proprietaire" on public.declarations;
create policy "declarations modifiables par le proprietaire" on public.declarations
  for update to authenticated using (auth.uid() = user_id);

-- ---------- MATCHS ---------------------------------------------------
create table if not exists public.matchs (
  id uuid primary key default gen_random_uuid(),
  declaration_perdu_id uuid not null references public.declarations(id) on delete cascade,
  declaration_trouve_id uuid not null references public.declarations(id) on delete cascade,
  code_validation text not null default lpad((floor(random() * 10000))::int::text, 4, '0'),
  statut text not null default 'nouveau',  -- nouveau | valide | clos
  created_at timestamptz not null default now(),
  unique (declaration_perdu_id, declaration_trouve_id)
);

create index if not exists idx_matchs_statut on public.matchs (statut);

-- Le code de validation n'est JAMAIS lisible directement : accès par RPC uniquement.
grant select (id, declaration_perdu_id, declaration_trouve_id, statut, created_at)
  on public.matchs to authenticated;
grant all on public.matchs to service_role;
alter table public.matchs enable row level security;

create or replace function public.is_match_party(_match_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matchs m
    join public.declarations dp on dp.id = m.declaration_perdu_id
    join public.declarations dt on dt.id = m.declaration_trouve_id
    where m.id = _match_id and (dp.user_id = _user_id or dt.user_id = _user_id)
  );
$$;

drop policy if exists "matchs lisibles par les parties" on public.matchs;
create policy "matchs lisibles par les parties" on public.matchs
  for select to authenticated using (public.is_match_party(id, auth.uid()));

-- ---------- MESSAGES (chat sécurisé) --------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matchs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contenu text not null check (char_length(contenu) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_match on public.messages (match_id, created_at);

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;

create or replace function public.is_match_valide(_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matchs m where m.id = _match_id and m.statut = 'valide');
$$;

drop policy if exists "messages lisibles par les parties" on public.messages;
create policy "messages lisibles par les parties" on public.messages
  for select to authenticated
  using (public.is_match_party(match_id, auth.uid()) and public.is_match_valide(match_id));

drop policy if exists "messages envoyables par les parties" on public.messages;
create policy "messages envoyables par les parties" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_match_party(match_id, auth.uid())
    and public.is_match_valide(match_id)
  );

-- ---------- ALGORITHME DE MATCH -------------------------------------
create or replace function public.check_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.matchs (declaration_perdu_id, declaration_trouve_id)
  select
    case when new.type = 'perdu' then new.id else d.id end,
    case when new.type = 'perdu' then d.id else new.id end
  from public.declarations d
  where d.id <> new.id
    and d.statut = 'actif'
    and d.type <> new.type
    and d.type_document = new.type_document
    and d.date_naissance = new.date_naissance
    and lower(trim(d.lieu_naissance)) = lower(trim(new.lieu_naissance))
    and d.date_delivrance = new.date_delivrance
  on conflict (declaration_perdu_id, declaration_trouve_id) do nothing;

  update public.declarations set last_matched_at = now()
  where id in (
    select declaration_perdu_id from public.matchs where declaration_perdu_id = new.id or declaration_trouve_id = new.id
    union
    select declaration_trouve_id from public.matchs where declaration_perdu_id = new.id or declaration_trouve_id = new.id
  );

  return new;
end;
$$;

drop trigger if exists on_declaration_created on public.declarations;
create trigger on_declaration_created
  after insert on public.declarations
  for each row execute function public.check_match();

-- ---------- CODE DE VALIDATION (RPC) --------------------------------
-- Le détenteur du document (déclaration "trouve") lit le code…
create or replace function public.get_code_validation(_match_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_code text;
begin
  select m.code_validation into v_code
  from public.matchs m
  join public.declarations dt on dt.id = m.declaration_trouve_id
  where m.id = _match_id and dt.user_id = auth.uid();

  if v_code is null then
    raise exception 'Acces refuse';
  end if;
  return v_code;
end;
$$;

-- …et le propriétaire (déclaration "perdu") le saisit pour ouvrir le chat.
create or replace function public.valider_code(_match_id uuid, _code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  select exists (
    select 1 from public.matchs m
    join public.declarations dp on dp.id = m.declaration_perdu_id
    where m.id = _match_id and dp.user_id = auth.uid() and m.code_validation = _code
  ) into v_ok;

  if v_ok then
    update public.matchs set statut = 'valide' where id = _match_id;
  end if;
  return v_ok;
end;
$$;

revoke all on function public.get_code_validation(uuid) from public, anon;
revoke all on function public.valider_code(uuid, text) from public, anon;
grant execute on function public.get_code_validation(uuid) to authenticated;
grant execute on function public.valider_code(uuid, text) to authenticated;

-- ---------- SIGNALEMENTS --------------------------------------------
create table if not exists public.signalements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  declaration_id uuid references public.declarations(id) on delete set null,
  raison text not null,          -- fausse_declaration | info_incorrecte | spam
  details text,
  email_contact text,
  statut text not null default 'en_attente',
  created_at timestamptz not null default now()
);

grant insert on public.signalements to authenticated, anon;
grant all on public.signalements to service_role;
alter table public.signalements enable row level security;

drop policy if exists "signalement ouvert a tous" on public.signalements;
create policy "signalement ouvert a tous" on public.signalements
  for insert to anon, authenticated with check (true);

-- ---------- PAIEMENTS (préparé pour la V2 Wave / Orange Money) -------
create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matchs(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  montant integer not null default 500,
  statut text not null default 'initie',  -- initie | confirme | echoue
  reference text unique,
  created_at timestamptz not null default now()
);

grant select, insert on public.paiements to authenticated;
grant all on public.paiements to service_role;
alter table public.paiements enable row level security;

drop policy if exists "paiements lisibles par le proprietaire" on public.paiements;
create policy "paiements lisibles par le proprietaire" on public.paiements
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "paiements creables par le proprietaire" on public.paiements;
create policy "paiements creables par le proprietaire" on public.paiements
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------- STATISTIQUES PUBLIQUES ----------------------------------
create or replace function public.get_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'declarations', (select count(*) from public.declarations),
    'perdus', (select count(*) from public.declarations where type = 'perdu'),
    'trouves', (select count(*) from public.declarations where type = 'trouve'),
    'matchs', (select count(*) from public.matchs),
    'matchs_valides', (select count(*) from public.matchs where statut in ('valide','clos'))
  );
$$;

grant execute on function public.get_stats() to anon, authenticated;
