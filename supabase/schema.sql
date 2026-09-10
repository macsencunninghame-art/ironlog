-- IronLog — shared database schema
--
-- Paste this whole file into the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to run more than once; every statement checks before it creates.
--
-- Shape mirrors the local data model, so one table per kind of thing, keyed by the
-- same person ids the app already uses ('macsy', 'mitchy', 'mezza', 'mcginley').
-- Anything with variable shape (the exercises inside a workout) stays as JSON rather
-- than being split into tables — it is written and read whole, never queried into.

-- ---------------------------------------------------------------- tables

create table if not exists workouts (
  id          text primary key,
  person_id   text        not null,
  day_id      integer     not null,
  date        timestamptz not null,
  exercises   jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists maxes (
  id          text primary key,
  person_id   text        not null,
  lift_id     text        not null,
  weight      numeric     not null,
  date        timestamptz not null,
  created_at  timestamptz not null default now()
);

create table if not exists broncos (
  id          text primary key,
  person_id   text        not null,
  date        timestamptz not null,
  seconds     numeric     not null,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists runs (
  id          text primary key,
  person_id   text        not null,
  date        timestamptz not null,
  distance_km numeric     not null,
  seconds     numeric     not null,
  note        text,
  source      text        not null default 'manual',
  created_at  timestamptz not null default now()
);

-- The image itself lives in Storage; this row is how the app finds and describes it.
create table if not exists photos (
  id          text primary key,
  person_id   text        not null,
  workout_id  text,
  day_id      integer,
  date        timestamptz not null,
  path        text        not null,
  created_at  timestamptz not null default now()
);

-- Every screen filters by person first, so that is the index worth having.
create index if not exists workouts_person_date_idx on workouts (person_id, date desc);
create index if not exists maxes_person_idx         on maxes    (person_id, lift_id);
create index if not exists broncos_person_date_idx  on broncos  (person_id, date desc);
create index if not exists runs_person_date_idx     on runs     (person_id, date desc);
create index if not exists photos_person_date_idx   on photos   (person_id, date desc);

-- ---------------------------------------------------------------- access rules
--
-- Open for now: anyone with the site can read and write. RLS is switched ON with
-- permissive policies rather than left off, so adding logins later means editing
-- these policies instead of re-architecting.
--
-- DELETE is deliberately granted to nobody. Removing the buttons stopped accidents
-- in the app; withholding the permission means even a bug, a stray script or a
-- console command cannot wipe someone's training. Deleting something for real is a
-- query run here in the dashboard — a deliberate act, by design.

alter table workouts enable row level security;
alter table maxes    enable row level security;
alter table broncos  enable row level security;
alter table runs     enable row level security;
alter table photos   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['workouts', 'maxes', 'broncos', 'runs', 'photos'] loop
    execute format('drop policy if exists %I on %I', t || '_read',   t);
    execute format('drop policy if exists %I on %I', t || '_insert', t);
    execute format('drop policy if exists %I on %I', t || '_update', t);

    execute format('create policy %I on %I for select using (true)', t || '_read', t);
    execute format('create policy %I on %I for insert with check (true)', t || '_insert', t);
    execute format('create policy %I on %I for update using (true) with check (true)', t || '_update', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- photo storage

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_object_read   on storage.objects;
drop policy if exists photos_object_insert on storage.objects;

create policy photos_object_read on storage.objects
  for select using (bucket_id = 'photos');

create policy photos_object_insert on storage.objects
  for insert with check (bucket_id = 'photos');

-- Again: no delete policy. A photo can only be removed from the dashboard.
