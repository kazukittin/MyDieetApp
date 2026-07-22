create table if not exists public.diet_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, entry_date)
);

create table if not exists public.diet_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diet_entries enable row level security;
alter table public.diet_user_settings enable row level security;

drop policy if exists "Users manage their own diet entries" on public.diet_entries;
create policy "Users manage their own diet entries"
on public.diet_entries
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own diet settings" on public.diet_user_settings;
create policy "Users manage their own diet settings"
on public.diet_user_settings
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.diet_entries from anon;
revoke all on table public.diet_user_settings from anon;
grant select, insert, update, delete on table public.diet_entries to authenticated;
grant select, insert, update, delete on table public.diet_user_settings to authenticated;

create or replace function public.keep_newest_diet_row()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_newest_diet_entry on public.diet_entries;
create trigger keep_newest_diet_entry
before update on public.diet_entries
for each row execute function public.keep_newest_diet_row();

drop trigger if exists keep_newest_diet_settings on public.diet_user_settings;
create trigger keep_newest_diet_settings
before update on public.diet_user_settings
for each row execute function public.keep_newest_diet_row();

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := (select auth.uid());
  legacy_rows_remain boolean := false;
begin
  if target_user_id is null then
    raise exception 'Authentication is required to delete an account';
  end if;

  -- Explicitly remove every row owned by the user. The function runs as one
  -- transaction, so any error or failed verification rolls everything back.
  delete from public.diet_entries where user_id = target_user_id;
  delete from public.diet_user_settings where user_id = target_user_id;

  -- Remove data from the legacy migration table when it still exists.
  if to_regclass('public.diet_user_data') is not null then
    execute 'delete from public.diet_user_data where user_id = $1'
      using target_user_id;
    execute 'select exists (select 1 from public.diet_user_data where user_id = $1)'
      into legacy_rows_remain
      using target_user_id;
  end if;

  if exists (select 1 from public.diet_entries where user_id = target_user_id)
    or exists (select 1 from public.diet_user_settings where user_id = target_user_id)
    or legacy_rows_remain then
    raise exception 'User data remains; account deletion was rolled back';
  end if;

  -- Deleting auth.users also removes Auth-owned dependent rows. Any unknown
  -- foreign-key dependency blocks this delete and rolls back the transaction.
  delete from auth.users where id = target_user_id;

  if exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Auth user remains; account deletion was rolled back';
  end if;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
