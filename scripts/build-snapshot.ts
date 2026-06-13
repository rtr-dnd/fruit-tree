/**
 * 解決済み種（scripts/.cache/resolved.json）→ アプリ同梱スナップショット＆DB投入SQL。
 *
 *   npm run resolve:taxa     # 先に解決（要ネットワーク・キャッシュあり）
 *   npm run build:snapshot   # snapshot.json と seed-taxa.sql を生成（オフライン）
 *
 * 出力:
 *  - lib/data/snapshot.json … 起動時の即時描画＋オフライン用キャッシュ（CatalogEntry[]）
 *  - scripts/out/seed-taxa.sql … Supabase taxa テーブルへの初回一括投入
 *  - lib/data/added-dates.json … 追加順の台帳（新規種に連番・日付を付与。created_at の生成に使用）
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResolvedSpecies } from '../lib/core/types'

const here = dirname(fileURLToPath(import.meta.url))
const RESOLVED_PATH = join(here, '.cache', 'resolved.json')
const LEDGER_PATH = join(here, '..', 'lib', 'data', 'added-dates.json')
const SNAPSHOT_PATH = join(here, '..', 'lib', 'data', 'snapshot.json')
const SQL_PATH = join(here, 'out', 'seed-taxa.sql')

interface LedgerRecord {
  seq: number
  date: string
}
interface CatalogEntry {
  id: string
  resolved: ResolvedSpecies
  createdAt: string
}

/** ledger の date+seq から、順序を保てる createdAt を合成する。 */
function createdAtFrom(rec: LedgerRecord): string {
  return new Date(Date.parse(`${rec.date}T00:00:00Z`) + rec.seq * 1000).toISOString()
}

/** 同梱用に祖先の説明等を落としたスリムな ResolvedSpecies。 */
function slim(s: ResolvedSpecies): ResolvedSpecies {
  return {
    id: s.id,
    scientificName: s.scientificName,
    names: s.names,
    imageUrl: s.imageUrl ?? null,
    wikipediaUrl: s.wikipediaUrl ?? null,
    description: s.description ?? null,
    searchAliases: s.searchAliases,
    classification: s.classification.map((c) => ({
      rank: c.rank,
      id: c.id,
      scientificName: c.scientificName,
      names: c.names ?? {},
      imageUrl: c.imageUrl ?? null,
    })),
  }
}

const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`

async function main() {
  const resolved = JSON.parse(
    await readFile(RESOLVED_PATH, 'utf8').catch(() => {
      throw new Error(`${RESOLVED_PATH} が無い。先に \`npm run resolve:taxa\` を実行。`)
    }),
  ) as ResolvedSpecies[]

  // 追加順台帳：新規種に連番・日付を付与（既存は不変）。
  const ledger: Record<string, LedgerRecord> = JSON.parse(
    await readFile(LEDGER_PATH, 'utf8').catch(() => '{}'),
  )
  let maxSeq = Object.values(ledger).reduce((m, r) => Math.max(m, r.seq), 0)
  const today = new Date().toISOString().slice(0, 10)
  for (const s of resolved) {
    if (!ledger[s.id]) ledger[s.id] = { seq: ++maxSeq, date: today }
  }

  const entries: CatalogEntry[] = resolved.map((s) => ({
    id: s.id,
    resolved: slim(s),
    createdAt: createdAtFrom(ledger[s.id]),
  }))

  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true })
  await writeFile(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8')
  await writeFile(SNAPSHOT_PATH, JSON.stringify(entries), 'utf8')

  // Supabase 一括投入SQL（SQL Editor で実行＝RLSをバイパス、created_by は null）。
  const values = entries
    .map(
      (e) =>
        `  (${sqlString(e.id)}, ${sqlString(JSON.stringify(e.resolved))}::jsonb, ${sqlString(e.createdAt)})`,
    )
    .join(',\n')
  const sql = `-- 初回一括投入（Supabase SQL Editor で実行）。再実行は id 競合をスキップ。
insert into public.taxa (id, resolved, created_at) values
${values}
on conflict (id) do nothing;
`
  await mkdir(dirname(SQL_PATH), { recursive: true })
  await writeFile(SQL_PATH, sql, 'utf8')

  console.log(`✔ snapshot: ${entries.length} 種 → ${SNAPSHOT_PATH}`)
  console.log(`✔ SQL: ${SQL_PATH}`)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
