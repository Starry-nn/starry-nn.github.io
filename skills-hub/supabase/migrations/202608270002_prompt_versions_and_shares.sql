create table if not exists public.private_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.private_prompts(id) on delete cascade,
  owner_id uuid not null references public.skill_users(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(prompt_id, version)
);

create table if not exists public.skill_share_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.skill_users(id) on delete cascade,
  label text not null,
  code_hash text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists prompt_versions_owner_idx on public.private_prompt_versions(owner_id, prompt_id);
create index if not exists share_codes_owner_idx on public.skill_share_codes(owner_id);
create index if not exists share_codes_lookup_idx on public.skill_share_codes(code_hash, expires_at) where revoked_at is null;

alter table public.private_prompt_versions enable row level security;
alter table public.skill_share_codes enable row level security;

revoke all on public.private_prompt_versions from anon, authenticated;
revoke all on public.skill_share_codes from anon, authenticated;

