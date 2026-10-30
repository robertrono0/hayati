-- =============================================================
-- Weekly check-ins: remembers who got a follow-up and when.
-- Paste into Supabase > SQL Editor > New query > Run (once).
-- =============================================================
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email', 'manual')),
  sent_by uuid references public.profiles(id),
  sent_at timestamptz not null default now()
);
create index if not exists followups_member_idx on public.followups (member_id, sent_at desc);

alter table public.followups enable row level security;
drop policy if exists "followups_admin" on public.followups;
create policy "followups_admin" on public.followups
  for all using (public.is_admin()) with check (public.is_admin());
