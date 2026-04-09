create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  group_name text not null,
  contact_email text not null,
  player_names text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.teams
add column if not exists current_floor integer not null default 1;

alter table public.teams
add column if not exists total_points integer not null default 0;

alter table public.teams
add column if not exists solved_levels integer not null default 0;

alter table public.teams
add column if not exists last_activity_at timestamptz;

create table if not exists public.leaderboard_entries (
  team_id uuid primary key references public.teams (id) on delete cascade,
  group_name text not null,
  current_floor integer not null default 1,
  total_points integer not null default 0,
  solved_levels integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.floor_completions (
  team_id uuid not null references public.teams (id) on delete cascade,
  floor_number integer not null check (floor_number between 1 and 8),
  placement integer check (placement is null or placement between 1 and 10),
  base_points integer not null,
  bonus_points integer not null default 0,
  total_awarded integer not null,
  completed_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, floor_number)
);

create unique index if not exists floor_completions_floor_number_placement_key
on public.floor_completions (floor_number, placement)
where placement is not null;

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

create or replace function public.sync_leaderboard_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_entries (
    team_id,
    group_name,
    current_floor,
    total_points,
    solved_levels,
    updated_at
  )
  values (
    new.id,
    new.group_name,
    new.current_floor,
    new.total_points,
    new.solved_levels,
    timezone('utc', now())
  )
  on conflict (team_id) do update
  set
    group_name = excluded.group_name,
    current_floor = excluded.current_floor,
    total_points = excluded.total_points,
    solved_levels = excluded.solved_levels,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.get_floor_base_points(p_floor_number integer)
returns integer
language sql
immutable
as $$
  select case p_floor_number
    when 1 then 100
    when 2 then 150
    when 3 then 200
    when 4 then 300
    when 5 then 400
    when 6 then 550
    when 7 then 700
    when 8 then 1000
    else 0
  end;
$$;

create or replace function public.get_floor_bonus_points(p_floor_number integer, p_placement integer)
returns integer
language sql
immutable
as $$
  select case
    when p_placement is null or p_placement > 10 then 0
    when p_floor_number between 1 and 2 then
      case
        when p_placement = 1 then 40
        when p_placement = 2 then 30
        when p_placement = 3 then 25
        when p_placement = 4 then 20
        when p_placement = 5 then 15
        else 10
      end
    when p_floor_number between 3 and 5 then
      case
        when p_placement = 1 then 80
        when p_placement = 2 then 65
        when p_placement = 3 then 50
        when p_placement = 4 then 40
        when p_placement = 5 then 30
        else 20
      end
    when p_floor_number between 6 and 8 then
      case
        when p_placement = 1 then 250
        when p_placement = 2 then 200
        when p_placement = 3 then 160
        when p_placement = 4 then 120
        when p_placement = 5 then 90
        else 50
      end
    else 0
  end;
$$;

create or replace function public.complete_floor(p_floor_number integer)
returns table (
  team_id uuid,
  group_name text,
  current_floor integer,
  total_points integer,
  solved_levels integer,
  last_activity_at timestamptz,
  placement integer,
  base_points integer,
  bonus_points integer,
  total_awarded integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_team public.teams%rowtype;
  existing_completion public.floor_completions%rowtype;
  awarded_placement integer;
  awarded_bonus integer;
  awarded_base integer;
  awarded_total integer;
  next_floor integer;
  total_floors constant integer := 8;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_floor_number is null or p_floor_number < 1 or p_floor_number > total_floors then
    raise exception 'Invalid floor number.';
  end if;

  select *
  into target_team
  from public.teams
  where auth_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'This team profile is missing from Supabase.';
  end if;

  if coalesce(target_team.solved_levels, 0) >= p_floor_number then
    select *
    into existing_completion
    from public.floor_completions as fc
    where fc.team_id = target_team.id
      and fc.floor_number = p_floor_number;

    return query
    select
      target_team.id,
      target_team.group_name,
      target_team.current_floor,
      target_team.total_points,
      target_team.solved_levels,
      target_team.last_activity_at,
      existing_completion.placement,
      coalesce(existing_completion.base_points, public.get_floor_base_points(p_floor_number)),
      coalesce(existing_completion.bonus_points, 0),
      coalesce(existing_completion.total_awarded, public.get_floor_base_points(p_floor_number));
    return;
  end if;

  if coalesce(target_team.current_floor, 1) < p_floor_number then
    raise exception 'This floor is still locked for your team.';
  end if;

  perform pg_advisory_xact_lock(4200, p_floor_number);

  select *
  into existing_completion
  from public.floor_completions as fc
  where fc.team_id = target_team.id
    and fc.floor_number = p_floor_number;

  if found then
    return query
    select
      target_team.id,
      target_team.group_name,
      target_team.current_floor,
      target_team.total_points,
      target_team.solved_levels,
      target_team.last_activity_at,
      existing_completion.placement,
      existing_completion.base_points,
      existing_completion.bonus_points,
      existing_completion.total_awarded;
    return;
  end if;

  awarded_base := public.get_floor_base_points(p_floor_number);

  if awarded_base <= 0 then
    raise exception 'This floor has no points configuration.';
  end if;

  select count(*) + 1
  into awarded_placement
  from public.floor_completions as fc
  where fc.floor_number = p_floor_number;

  if awarded_placement > 10 then
    awarded_bonus := 0;
    awarded_placement := null;
  else
    awarded_bonus := public.get_floor_bonus_points(p_floor_number, awarded_placement);
  end if;

  awarded_total := awarded_base + awarded_bonus;
  next_floor := case
    when p_floor_number >= total_floors then total_floors
    else p_floor_number + 1
  end;

  insert into public.floor_completions (
    team_id,
    floor_number,
    placement,
    base_points,
    bonus_points,
    total_awarded,
    completed_at
  )
  values (
    target_team.id,
    p_floor_number,
    awarded_placement,
    awarded_base,
    awarded_bonus,
    awarded_total,
    timezone('utc', now())
  );

  update public.teams
  set
    solved_levels = greatest(coalesce(solved_levels, 0), p_floor_number),
    current_floor = greatest(coalesce(current_floor, 1), next_floor),
    total_points = coalesce(total_points, 0) + awarded_total,
    last_activity_at = timezone('utc', now())
  where id = target_team.id
  returning *
  into target_team;

  return query
  select
    target_team.id,
    target_team.group_name,
    target_team.current_floor,
    target_team.total_points,
    target_team.solved_levels,
    target_team.last_activity_at,
    awarded_placement,
    awarded_base,
    awarded_bonus,
    awarded_total;
end;
$$;

drop trigger if exists teams_sync_leaderboard_entry on public.teams;

create trigger teams_sync_leaderboard_entry
after insert or update on public.teams
for each row
execute procedure public.sync_leaderboard_entry();

insert into public.leaderboard_entries (
  team_id,
  group_name,
  current_floor,
  total_points,
  solved_levels,
  updated_at
)
select
  id,
  group_name,
  current_floor,
  total_points,
  solved_levels,
  timezone('utc', now())
from public.teams
on conflict (team_id) do update
set
  group_name = excluded.group_name,
  current_floor = excluded.current_floor,
  total_points = excluded.total_points,
  solved_levels = excluded.solved_levels,
  updated_at = timezone('utc', now());

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
alter table public.leaderboard_entries enable row level security;
alter table public.floor_completions enable row level security;

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

drop policy if exists "authenticated users can read leaderboard" on public.leaderboard_entries;
create policy "authenticated users can read leaderboard"
on public.leaderboard_entries
for select
to authenticated
using (true);

drop policy if exists "teams can read own floor completions" on public.floor_completions;
create policy "teams can read own floor completions"
on public.floor_completions
for select
to authenticated
using (
  exists (
    select 1
    from public.teams
    where public.teams.id = public.floor_completions.team_id
      and public.teams.auth_user_id = auth.uid()
  )
);

grant execute on function public.complete_floor(integer) to authenticated;
