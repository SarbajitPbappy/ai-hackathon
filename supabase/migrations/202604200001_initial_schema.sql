create extension if not exists "pgcrypto";

create type public.user_role as enum ('super_admin', 'organizer', 'participant', 'judge');
create type public.contest_type as enum ('coding', 'hackathon');
create type public.contest_status as enum ('draft', 'upcoming', 'active', 'ended');
create type public.scoring_style as enum ('acm', 'ioi');
create type public.contest_visibility as enum ('public', 'private');
create type public.problem_difficulty as enum ('easy', 'medium', 'hard');
create type public.submission_verdict as enum (
  'pending',
  'accepted',
  'wrong_answer',
  'tle',
  'mle',
  'runtime_error',
  'compilation_error'
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  rating integer not null default 1200,
  role public.user_role not null default 'participant',
  country text,
  github_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  type public.contest_type not null,
  status public.contest_status not null default 'draft',
  scoring_style public.scoring_style not null default 'acm',
  start_time timestamptz not null,
  end_time timestamptz not null,
  visibility public.contest_visibility not null default 'public',
  invite_code text,
  freeze_scoreboard_at timestamptz,
  organizer_id uuid not null references public.users(id) on delete restrict,
  max_participants integer,
  banner_url text,
  created_at timestamptz not null default now(),
  constraint contests_time_check check (end_time > start_time)
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  title text not null,
  slug text not null,
  statement text not null,
  input_format text,
  output_format text,
  constraints text,
  difficulty public.problem_difficulty not null,
  time_limit_ms integer not null default 2000,
  memory_limit_mb integer not null default 256,
  points integer not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique (contest_id, slug)
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input text not null,
  expected_output text not null,
  is_sample boolean not null default false,
  order_index integer not null
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  name text not null,
  invite_code text unique not null,
  leader_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (contest_id, name)
);

create table if not exists public.contest_registrations (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  registered_at timestamptz not null default now(),
  unique (contest_id, user_id)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  code text not null,
  language text not null,
  verdict public.submission_verdict not null default 'pending',
  time_ms integer,
  memory_kb integer,
  score integer,
  judge0_token text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.hackathon_submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  title text not null,
  description text not null,
  github_url text,
  demo_url text,
  video_url text,
  tech_stack text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  unique (team_id, contest_id)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  hackathon_submission_id uuid not null references public.hackathon_submissions(id) on delete cascade,
  judge_id uuid not null references public.users(id) on delete cascade,
  innovation integer not null check (innovation between 0 and 10),
  technical integer not null check (technical between 0 and 10),
  presentation integer not null check (presentation between 0 and 10),
  impact integer not null check (impact between 0 and 10),
  feedback text,
  scored_at timestamptz not null default now(),
  unique (hackathon_submission_id, judge_id)
);

create table if not exists public.leaderboard_cache (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  total_score integer not null default 0,
  problems_solved integer not null default 0,
  penalty_time integer not null default 0,
  last_ac_time timestamptz,
  rank integer,
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id)
);

create index if not exists contests_organizer_id_idx on public.contests (organizer_id);
create index if not exists contests_status_idx on public.contests (status);
create index if not exists contests_type_idx on public.contests (type);
create index if not exists problems_contest_id_idx on public.problems (contest_id);
create index if not exists test_cases_problem_id_idx on public.test_cases (problem_id);
create index if not exists submissions_contest_user_idx on public.submissions (contest_id, user_id);
create index if not exists submissions_problem_user_idx on public.submissions (problem_id, user_id);
create index if not exists contest_registrations_contest_idx on public.contest_registrations (contest_id);
create index if not exists contest_registrations_user_idx on public.contest_registrations (user_id);
create index if not exists teams_contest_idx on public.teams (contest_id);
create index if not exists team_members_team_idx on public.team_members (team_id);
create index if not exists hackathon_submissions_contest_idx on public.hackathon_submissions (contest_id);
create index if not exists scores_submission_idx on public.scores (hackathon_submission_id);
create index if not exists leaderboard_cache_contest_rank_idx on public.leaderboard_cache (contest_id, rank);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin_or_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('organizer', 'super_admin'), false);
$$;

create or replace function public.is_registered_for_contest(target_contest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contest_registrations cr
    where cr.contest_id = target_contest_id
      and cr.user_id = auth.uid()
  );
$$;

create or replace function public.is_contest_organizer(target_contest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests c
    where c.id = target_contest_id
      and c.organizer_id = auth.uid()
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin_or_super_admin() to authenticated;
grant execute on function public.is_registered_for_contest(uuid) to authenticated;
grant execute on function public.is_contest_organizer(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.contests enable row level security;
alter table public.problems enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.contest_registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.hackathon_submissions enable row level security;
alter table public.scores enable row level security;
alter table public.leaderboard_cache enable row level security;

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "contests_select_visible"
  on public.contests
  for select
  to authenticated
  using (
    visibility = 'public'
    or organizer_id = auth.uid()
    or public.is_registered_for_contest(id)
    or public.current_user_role() in ('judge', 'super_admin')
  );

create policy "contests_insert_admin"
  on public.contests
  for insert
  to authenticated
  with check (
    public.is_admin_or_super_admin()
    and (organizer_id = auth.uid() or public.current_user_role() = 'super_admin')
  );

create policy "contests_update_admin"
  on public.contests
  for update
  to authenticated
  using (
    organizer_id = auth.uid() or public.current_user_role() = 'super_admin'
  )
  with check (
    organizer_id = auth.uid() or public.current_user_role() = 'super_admin'
  );

create policy "contests_delete_admin"
  on public.contests
  for delete
  to authenticated
  using (
    organizer_id = auth.uid() or public.current_user_role() = 'super_admin'
  );

create policy "problems_select_registered_after_start"
  on public.problems
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contests c
      where c.id = contest_id
        and (
          c.organizer_id = auth.uid()
          or public.current_user_role() = 'super_admin'
          or (now() >= c.start_time and public.is_registered_for_contest(c.id))
        )
    )
  );

create policy "problems_mutate_by_organizer"
  on public.problems
  for all
  to authenticated
  using (
    public.is_contest_organizer(contest_id) or public.current_user_role() = 'super_admin'
  )
  with check (
    public.is_contest_organizer(contest_id) or public.current_user_role() = 'super_admin'
  );

create policy "test_cases_select_registered_after_start"
  on public.test_cases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.problems p
      join public.contests c on c.id = p.contest_id
      where p.id = problem_id
        and (
          c.organizer_id = auth.uid()
          or public.current_user_role() = 'super_admin'
          or (now() >= c.start_time and public.is_registered_for_contest(c.id))
        )
    )
  );

create policy "test_cases_mutate_by_organizer"
  on public.test_cases
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.problems p
      where p.id = problem_id
        and (public.is_contest_organizer(p.contest_id) or public.current_user_role() = 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.problems p
      where p.id = problem_id
        and (public.is_contest_organizer(p.contest_id) or public.current_user_role() = 'super_admin')
    )
  );

create policy "submissions_select_owner_or_organizer"
  on public.submissions
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  );

create policy "submissions_insert_owner"
  on public.submissions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_registered_for_contest(contest_id)
  );

create policy "submissions_update_organizer"
  on public.submissions
  for update
  to authenticated
  using (
    public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('super_admin', 'judge')
  )
  with check (
    public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('super_admin', 'judge')
  );

create policy "contest_registrations_select"
  on public.contest_registrations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  );

create policy "contest_registrations_insert_self"
  on public.contest_registrations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1
        from public.contests c
        where c.id = contest_id
          and (
            c.visibility = 'public'
            or c.organizer_id = auth.uid()
            or public.current_user_role() = 'super_admin'
          )
      )
    )
  );

create policy "contest_registrations_update_self_or_organizer"
  on public.contest_registrations
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  )
  with check (
    user_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  );

create policy "teams_select_registered"
  on public.teams
  for select
  to authenticated
  using (
    public.is_registered_for_contest(contest_id)
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('judge', 'super_admin')
  );

create policy "teams_insert_registered"
  on public.teams
  for insert
  to authenticated
  with check (
    leader_id = auth.uid()
    and public.is_registered_for_contest(contest_id)
  );

create policy "teams_update_leader_or_organizer"
  on public.teams
  for update
  to authenticated
  using (
    leader_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  )
  with check (
    leader_id = auth.uid()
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() = 'super_admin'
  );

create policy "team_members_select_member_or_organizer"
  on public.team_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (
          t.leader_id = auth.uid()
          or public.is_contest_organizer(t.contest_id)
          or public.current_user_role() in ('judge', 'super_admin')
        )
    )
  );

create policy "team_members_insert_leader_or_self"
  on public.team_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and t.leader_id = auth.uid()
    )
  );

create policy "team_members_delete_leader_or_self"
  on public.team_members
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.leader_id = auth.uid() or public.is_contest_organizer(t.contest_id))
    )
  );

create policy "hackathon_submissions_select"
  on public.hackathon_submissions
  for select
  to authenticated
  using (
    public.is_registered_for_contest(contest_id)
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('judge', 'super_admin')
  );

create policy "hackathon_submissions_insert_team_leader"
  on public.hackathon_submissions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.teams t
      where t.id = team_id
        and t.leader_id = auth.uid()
        and t.contest_id = contest_id
    )
  );

create policy "hackathon_submissions_update_team_leader"
  on public.hackathon_submissions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.leader_id = auth.uid() or public.is_contest_organizer(t.contest_id))
    )
  )
  with check (
    exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.leader_id = auth.uid() or public.is_contest_organizer(t.contest_id))
    )
  );

create policy "scores_select"
  on public.scores
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hackathon_submissions hs
      where hs.id = hackathon_submission_id
        and (
          public.is_contest_organizer(hs.contest_id)
          or public.current_user_role() in ('judge', 'super_admin')
          or public.is_registered_for_contest(hs.contest_id)
        )
    )
  );

create policy "scores_insert_judge"
  on public.scores
  for insert
  to authenticated
  with check (
    judge_id = auth.uid()
    and public.current_user_role() = 'judge'
  );

create policy "scores_update_judge"
  on public.scores
  for update
  to authenticated
  using (
    judge_id = auth.uid()
    and public.current_user_role() = 'judge'
  )
  with check (
    judge_id = auth.uid()
    and public.current_user_role() = 'judge'
  );

create policy "leaderboard_cache_select_registered"
  on public.leaderboard_cache
  for select
  to authenticated
  using (
    public.is_registered_for_contest(contest_id)
    or public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('judge', 'super_admin')
  );

create policy "leaderboard_cache_mutate_organizer"
  on public.leaderboard_cache
  for all
  to authenticated
  using (
    public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('organizer', 'super_admin')
  )
  with check (
    public.is_contest_organizer(contest_id)
    or public.current_user_role() in ('organizer', 'super_admin')
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
