create table if not exists public.diet_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diet_user_data enable row level security;

drop policy if exists "Users can read their own diet data" on public.diet_user_data;
create policy "Users can read their own diet data"
on public.diet_user_data
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own diet data" on public.diet_user_data;
create policy "Users can create their own diet data"
on public.diet_user_data
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own diet data" on public.diet_user_data;
create policy "Users can update their own diet data"
on public.diet_user_data
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.diet_user_data from anon;
grant select, insert, update on table public.diet_user_data to authenticated;
