-- アプリ内追補（§7.4 モデルB）＝みんなで足せる共有カタログ。
-- 閲覧: 誰でも（未ログイン含む） / 追加: ログイン済みなら誰でも / 削除: 管理者のみ。
-- 旧・ユーザー個別版から作り直すため、いったん drop（冪等）。
drop table if exists public.supplemental_taxa cascade;

-- ── 管理者テーブル ──
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

-- 自分が管理者かどうかは本人だけ確認できる。
drop policy if exists "admins_self_select" on public.admins;
create policy "admins_self_select"
  on public.admins for select
  using (auth.uid() = user_id);

-- ポリシーから安全に参照するための判定関数（admins の RLS を迂回）。
create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── 共有追補テーブル ──
create table public.supplemental_taxa (
  gbif_usage_key bigint      not null primary key,   -- 同じ果物は1行だけ（グローバル一意）
  resolved       jsonb       not null,               -- 解決済み ResolvedSpecies（lineage/names/image 等）
  created_by     uuid        references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.supplemental_taxa enable row level security;

-- 閲覧: 誰でも（未ログインの匿名キーでも読める）。
drop policy if exists "supplemental_public_read" on public.supplemental_taxa;
create policy "supplemental_public_read"
  on public.supplemental_taxa for select
  using (true);

-- 追加: ログイン済みなら誰でも。自分を created_by として記録する。
drop policy if exists "supplemental_insert_authenticated" on public.supplemental_taxa;
create policy "supplemental_insert_authenticated"
  on public.supplemental_taxa for insert
  with check (auth.uid() = created_by);

-- 削除: 管理者のみ（不適切な追加の除去）。
drop policy if exists "supplemental_admin_delete" on public.supplemental_taxa;
create policy "supplemental_admin_delete"
  on public.supplemental_taxa for delete
  using (public.is_admin());

-- 更新も管理者のみ（任意）。
drop policy if exists "supplemental_admin_update" on public.supplemental_taxa;
create policy "supplemental_admin_update"
  on public.supplemental_taxa for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── 自分を管理者にする（初回のみ。メールは自分のものに） ──
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'skysoyn@gmail.com'
--   on conflict do nothing;
