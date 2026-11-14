-- ============================================================================
--  Scholars Hub - database schema
--  Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query)
--  It is safe to run again: every object is created idempotently.
--  No plpgsql functions are used, so nothing here can fail with 42P13.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Course catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  code text primary key,
  title text not null,
  short_title text not null,
  weekly_price numeric(10, 2) not null default 10 check (weekly_price >= 0)
);

alter table public.courses enable row level security;

drop policy if exists "Courses are readable by everyone" on public.courses;
create policy "Courses are readable by everyone"
  on public.courses for select
  using (true);

insert into public.courses (code, title, short_title, weekly_price)
values
  ('MATH121', 'Mathematics 121', 'Maths 121', 10),
  ('MATH123', 'Mathematics 123', 'Maths 123', 10),
  ('STAT111', 'Statistics 111', 'Stats 111', 10)
on conflict (code) do update
  set title = excluded.title,
      short_title = excluded.short_title,
      weekly_price = excluded.weekly_price;

-- ---------------------------------------------------------------------------
-- Student profiles (one row per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_id text not null unique,
  full_name text not null,
  school text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_student_id_idx on public.profiles (student_id);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by signed-in students" on public.profiles;
create policy "Profiles are readable by signed-in students"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Students insert their own profile" on public.profiles;
create policy "Students insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Students update their own profile" on public.profiles;
create policy "Students update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Enrolments (1 to 3 courses per student)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  course_code text not null references public.courses (code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, course_code)
);

alter table public.enrollments enable row level security;

drop policy if exists "Students read their own enrolments" on public.enrollments;
create policy "Students read their own enrolments"
  on public.enrollments for select
  to authenticated
  using (profile_id = auth.uid());

-- The 3-course limit is enforced here, in pure SQL: a student may only insert
-- an enrolment while they already hold fewer than three.
drop policy if exists "Students create their own enrolments" on public.enrollments;
create policy "Students create their own enrolments"
  on public.enrollments for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and (
      select count(*)
      from public.enrollments e
      where e.profile_id = auth.uid()
    ) < 3
  );

drop policy if exists "Students remove their own enrolments" on public.enrollments;
create policy "Students remove their own enrolments"
  on public.enrollments for delete
  to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Channels (broadcast boards, one owner each)
-- ---------------------------------------------------------------------------
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 60),
  description text check (char_length(description) <= 280),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists channels_created_at_idx on public.channels (created_at desc);

alter table public.channels enable row level security;

drop policy if exists "Channels are readable by signed-in students" on public.channels;
create policy "Channels are readable by signed-in students"
  on public.channels for select
  to authenticated
  using (true);

drop policy if exists "Students create channels as themselves" on public.channels;
create policy "Students create channels as themselves"
  on public.channels for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Owners update their channel" on public.channels;
create policy "Owners update their channel"
  on public.channels for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Owners delete their channel" on public.channels;
create policy "Owners delete their channel"
  on public.channels for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Posts: notices and polls
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('notice', 'poll')),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists posts_channel_idx on public.posts (channel_id, created_at desc);

alter table public.posts enable row level security;

drop policy if exists "Posts are readable by signed-in students" on public.posts;
create policy "Posts are readable by signed-in students"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "Channel owners publish posts" on public.posts;
create policy "Channel owners publish posts"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.channels c
      where c.id = channel_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Authors delete their posts" on public.posts;
create policy "Authors delete their posts"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Poll options + votes
-- ---------------------------------------------------------------------------
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  position int not null default 0
);

create index if not exists poll_options_post_idx on public.poll_options (post_id, position);

alter table public.poll_options enable row level security;

drop policy if exists "Poll options are readable by signed-in students" on public.poll_options;
create policy "Poll options are readable by signed-in students"
  on public.poll_options for select
  to authenticated
  using (true);

drop policy if exists "Post authors add poll options" on public.poll_options;
create policy "Post authors add poll options"
  on public.poll_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid() and p.kind = 'poll'
    )
  );

create table if not exists public.poll_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

create index if not exists poll_votes_option_idx on public.poll_votes (option_id);

alter table public.poll_votes enable row level security;

drop policy if exists "Votes are readable by signed-in students" on public.poll_votes;
create policy "Votes are readable by signed-in students"
  on public.poll_votes for select
  to authenticated
  using (true);

drop policy if exists "Students cast their own vote" on public.poll_votes;
create policy "Students cast their own vote"
  on public.poll_votes for insert
  to authenticated
  with check (voter_id = auth.uid());

drop policy if exists "Students change their own vote" on public.poll_votes;
create policy "Students change their own vote"
  on public.poll_votes for update
  to authenticated
  using (voter_id = auth.uid())
  with check (voter_id = auth.uid());

drop policy if exists "Students remove their own vote" on public.poll_votes;
create policy "Students remove their own vote"
  on public.poll_votes for delete
  to authenticated
  using (voter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Personal timetables
-- ---------------------------------------------------------------------------
create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  course_code text not null references public.courses (code),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  location text check (char_length(location) <= 120),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists timetable_profile_idx
  on public.timetable_entries (profile_id, day_of_week, start_time);

alter table public.timetable_entries enable row level security;

drop policy if exists "Students read their own timetable" on public.timetable_entries;
create policy "Students read their own timetable"
  on public.timetable_entries for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "Students add their own meetings" on public.timetable_entries;
create policy "Students add their own meetings"
  on public.timetable_entries for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "Students delete their own meetings" on public.timetable_entries;
create policy "Students delete their own meetings"
  on public.timetable_entries for delete
  to authenticated
  using (profile_id = auth.uid());
