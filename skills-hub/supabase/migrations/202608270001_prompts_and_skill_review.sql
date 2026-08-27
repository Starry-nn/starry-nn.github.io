alter table public.private_skills
  add column if not exists title text;

update public.private_skills
set title = name
where title is null;

create table if not exists public.private_prompts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.skill_users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null,
  category text not null,
  body text not null,
  task_types text[] not null default '{}',
  triggers text[] not null default '{}',
  inputs text[] not null default '{}',
  outputs text[] not null default '{}',
  language text not null default 'zh',
  version integer not null default 1 check (version > 0),
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  source text not null default 'user-upload',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create index if not exists private_prompts_owner_idx on public.private_prompts(owner_id);
create index if not exists private_prompts_category_idx on public.private_prompts(owner_id, category);

alter table public.private_prompts enable row level security;
revoke all on public.private_prompts from anon, authenticated;

