-- ユーザー記録テーブル（§6.2）。ログイン単位で隔離、RLS で自分の行のみ読み書き可。
create table if not exists public.fruit_log (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  taxon_id    text        not null,              -- SPECIES ノードの id（静的ツリー側。外部キーにしない）
  tried       boolean     not null default true,
  rating      smallint    check (rating between 1 and 5),
  notes       text,
  place       text,
  tried_date  date,
  updated_at  timestamptz not null default now(),
  primary key (user_id, taxon_id)
);

alter table public.fruit_log enable row level security;

drop policy if exists "fruit_log_own_rows" on public.fruit_log;
create policy "fruit_log_own_rows"
  on public.fruit_log
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at をサーバ側でも更新（クライアントが入れない場合の保険）。
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists fruit_log_touch on public.fruit_log;
create trigger fruit_log_touch
  before update on public.fruit_log
  for each row execute function public.touch_updated_at();
