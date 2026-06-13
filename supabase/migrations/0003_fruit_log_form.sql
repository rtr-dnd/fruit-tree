-- 「食べた」の区別：生で食べた(raw) / 加工品を食べた(processed)。
-- 値が無い＝（旧データの）区別なしの「食べた」。tried=false は「食べたことない」。
alter table public.fruit_log
  add column if not exists form text
  check (form is null or form in ('raw', 'processed'));
