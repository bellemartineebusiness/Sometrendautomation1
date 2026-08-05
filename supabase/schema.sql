-- Run this in the Supabase SQL editor to set up the tables the
-- /api/cron/trend-digest route reads from and writes to.

create table if not exists trends (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  year int not null,
  niche text not null,
  platform text not null,
  title text not null,
  description text not null,
  growth_percent numeric not null,
  sparkline jsonb not null, -- array of numbers, e.g. [12, 18, 9, 22, ...]
  rank int not null, -- 1 = featured "trend of the week", 2+ = list order
  created_at timestamptz not null default now()
);

create index if not exists trends_week_niche_idx
  on trends (year, week_number, niche, rank);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  niche text not null,
  unsubscribed boolean not null default false,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists trend_digest_log (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references subscribers(id),
  week_number int not null,
  year int not null,
  status text not null check (status in ('sent', 'failed')),
  error text,
  sent_at timestamptz not null default now()
);

-- A subscriber can only have one *successful* send per week — this is the
-- idempotency guard that stops the digest from going out twice by accident.
-- Failed attempts are not constrained so a retry can insert a new row.
create unique index if not exists trend_digest_log_sent_once
  on trend_digest_log (subscriber_id, week_number, year)
  where status = 'sent';
