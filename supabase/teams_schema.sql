create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  group_name text not null,
  contact_email text not null,
  player_names text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists teams_set_updated_at on public.teams;

create trigger teams_set_updated_at
before update on public.teams
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_team_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  names text[];
  fallback_name text;
begin
  names := coalesce(
    array(
      select jsonb_array_elements_text(
        coalesce(new.raw_user_meta_data -> 'player_names', '[]'::jsonb)
      )
    ),
    '{}'
  );

  fallback_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'group_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.teams (
    auth_user_id,
    group_name,
    contact_email,
    player_names
  )
  values (
    new.id,
    fallback_name,
    new.email,
    names
  )
  on conflict (auth_user_id) do update
  set
    group_name = excluded.group_name,
    contact_email = excluded.contact_email,
    player_names = excluded.player_names,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_team on auth.users;

create trigger on_auth_user_created_team
after insert on auth.users
for each row
execute procedure public.handle_team_signup();

alter table public.teams enable row level security;

drop policy if exists "teams can read own record" on public.teams;
create policy "teams can read own record"
on public.teams
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "teams can update own record" on public.teams;
create policy "teams can update own record"
on public.teams
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
