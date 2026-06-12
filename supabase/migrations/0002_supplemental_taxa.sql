-- 将来のモデルB（アプリ内追補 / §6.3・§7.4）用。当面は未使用だが seam として用意。
create table if not exists public.supplemental_taxa (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  gbif_usage_key bigint      not null,
  resolved       jsonb       not null,   -- 解決済み ResolvedSpecies（lineage/names/image 等）
  created_at     timestamptz not null default now(),
  primary key (user_id, gbif_usage_key)
);

alter table public.supplemental_taxa enable row level security;

drop policy if exists "supplemental_taxa_own_rows" on public.supplemental_taxa;
create policy "supplemental_taxa_own_rows"
  on public.supplemental_taxa
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
