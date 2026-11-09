-- Run in your own Supabase project SQL editor before signing in to DayPilot.
create table if not exists public.daypilot_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.daypilot_profiles enable row level security;
drop policy if exists "owner selects daypilot data" on public.daypilot_profiles;
drop policy if exists "owner inserts daypilot data" on public.daypilot_profiles;
drop policy if exists "owner updates daypilot data" on public.daypilot_profiles;
create policy "owner selects daypilot data" on public.daypilot_profiles for select to authenticated using (auth.uid()=user_id);
create policy "owner inserts daypilot data" on public.daypilot_profiles for insert to authenticated with check (auth.uid()=user_id);
create policy "owner updates daypilot data" on public.daypilot_profiles for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

create table if not exists public.daypilot_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 subscription jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.daypilot_push_subscriptions enable row level security;
drop policy if exists "owner reads push" on public.daypilot_push_subscriptions;
drop policy if exists "owner inserts push" on public.daypilot_push_subscriptions;
drop policy if exists "owner updates push" on public.daypilot_push_subscriptions;
drop policy if exists "owner deletes push" on public.daypilot_push_subscriptions;
create policy "owner reads push" on public.daypilot_push_subscriptions for select to authenticated using (auth.uid()=user_id);
create policy "owner inserts push" on public.daypilot_push_subscriptions for insert to authenticated with check (auth.uid()=user_id);
create policy "owner updates push" on public.daypilot_push_subscriptions for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "owner deletes push" on public.daypilot_push_subscriptions for delete to authenticated using (auth.uid()=user_id);

create table if not exists public.daypilot_notification_log (
 user_id uuid not null references auth.users(id) on delete cascade,
 notification_key text not null,
 created_at timestamptz not null default now(),
 primary key(user_id,notification_key)
);
alter table public.daypilot_notification_log enable row level security;
-- No client policies: only the server's service role can read/write this deduplication log.

-- Data API privileges; RLS remains enforced for authenticated users.
grant select, insert, update on public.daypilot_profiles to authenticated;
grant select, insert, update, delete on public.daypilot_push_subscriptions to authenticated;
