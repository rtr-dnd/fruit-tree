-- フルーツのカタログ全体（分類解決済み）を Supabase で一元管理する。
-- 閲覧: 誰でも（未ログイン含む） / 追加: ログイン済みなら誰でも / 削除・更新: 管理者のみ。

-- 旧・ユーザー個別/共有追補テーブルがあれば破棄（冪等）。
drop table if exists public.supplemental_taxa cascade;

-- ── 管理者テーブル ──
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

drop policy if exists "admins_self_select" on public.admins;
create policy "admins_self_select"
  on public.admins for select
  using (auth.uid() = user_id);

-- ポリシーから安全に参照する管理者判定（admins の RLS を迂回）。
create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── カタログ本体 ──
create table if not exists public.taxa (
  id          text        not null primary key,   -- 種の安定slug（例: durio-zibethinus）
  resolved    jsonb       not null,               -- 解決済み ResolvedSpecies（分類・名前・画像等）
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.taxa enable row level security;

-- 閲覧: 誰でも（未ログインの匿名キーでも読める）。
drop policy if exists "taxa_public_read" on public.taxa;
create policy "taxa_public_read"
  on public.taxa for select
  using (true);

-- 追加: ログイン済みなら誰でも。自分を created_by として記録する。
drop policy if exists "taxa_insert_authenticated" on public.taxa;
create policy "taxa_insert_authenticated"
  on public.taxa for insert
  with check (auth.uid() = created_by);

-- 削除・更新: 管理者のみ（不適切な項目の除去・修正）。
drop policy if exists "taxa_admin_delete" on public.taxa;
create policy "taxa_admin_delete"
  on public.taxa for delete
  using (public.is_admin());

drop policy if exists "taxa_admin_update" on public.taxa;
create policy "taxa_admin_update"
  on public.taxa for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── 自分を管理者にする（初回のみ。メールは自分のものに） ──
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'skysoyn@gmail.com'
--   on conflict do nothing;
