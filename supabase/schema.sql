-- =============================================================
-- Hayati matchmaking: database schema
-- Paste this whole file into Supabase > SQL Editor > New query > Run
-- Safe to run once on a fresh project.
-- =============================================================

-- ---------- Profiles (one per signed-up person) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'active', 'paused', 'matched', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Questionnaire answers ----------
create table if not exists public.questionnaire_responses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- Matches (admins only) ----------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  member_a uuid not null references public.profiles(id) on delete cascade,
  member_b uuid not null references public.profiles(id) on delete cascade,
  score int check (score between 0 and 100),
  ai_summary text,
  ai_strengths text,
  ai_concerns text,
  status text not null default 'suggested'
    check (status in ('suggested', 'approved', 'rejected', 'contacted', 'introduced', 'dating', 'closed')),
  admin_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (member_a <> member_b)
);
-- one row per pair, regardless of order
create unique index if not exists matches_pair_unique
  on public.matches (least(member_a, member_b), greatest(member_a, member_b));

-- ---------- Private admin notes on members ----------
create table if not exists public.member_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid references public.profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------- Helper: is the current user an admin? ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Auto-create a profile when someone signs up ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;
  insert into public.questionnaire_responses (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Stop members from promoting themselves or changing their own status ----------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null in the Supabase SQL editor, so the owner can still edit freely there
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    -- members may only move themselves from draft to submitted
    if not (old.status = 'draft' and new.status = 'submitted') then
      new.status := old.status;
    end if;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------- Lock questionnaire after submission (members) ----------
create or replace function public.protect_questionnaire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() and old.submitted_at is not null then
    raise exception 'Questionnaire already submitted. Contact the team to make changes.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_questionnaire on public.questionnaire_responses;
create trigger protect_questionnaire
  before update on public.questionnaire_responses
  for each row execute function public.protect_questionnaire();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.matches enable row level security;
alter table public.member_notes enable row level security;

-- Profiles: members see and edit only themselves; admins see and edit everyone
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Questionnaire: members see and edit only their own; admins see all
drop policy if exists "qr_select" on public.questionnaire_responses;
create policy "qr_select" on public.questionnaire_responses
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "qr_insert" on public.questionnaire_responses;
create policy "qr_insert" on public.questionnaire_responses
  for insert with check (user_id = auth.uid());

drop policy if exists "qr_update" on public.questionnaire_responses;
create policy "qr_update" on public.questionnaire_responses
  for update using (user_id = auth.uid() or public.is_admin());

-- Matches and notes: admins only. Members can never read them.
drop policy if exists "matches_admin" on public.matches;
create policy "matches_admin" on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notes_admin" on public.member_notes;
create policy "notes_admin" on public.member_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================
-- AFTER you sign up on the site yourself, run this ONE line
-- (with your email) to make yourself an admin:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================
