/**
 * ResolvedSpecies[] → 静的分類ツリー taxa.json（§7 ステップ4-5）。
 * buildTaxonTree（§5.4 の純関数）でルート決定＋プルーニングし、アプリにバンドルする。
 *
 *   npm run resolve:taxa   # 先に解決（要ネットワーク）
 *   npm run build:taxa     # ツリー構築（オフライン）
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { buildTaxonTree } from '../lib/core/tree'
import type { ResolvedSpecies } from '../lib/core/types'
import {
  RESOLVED_PATH,
  TAXA_OUT_PATH as OUT_PATH,
  ADDED_DATES_PATH,
  RESOLVED_BUNDLE_PATH,
} from './lib/paths'

interface AddedRecord {
  seq: number
  date: string
}
type AddedLedger = Record<string, AddedRecord>

/**
 * 種ごとの「追加日・追加順」を台帳に記録（新規種のみ追記、既存は不変）。
 * 連番は常に現在の最大値の続きを振るため、シードのどこに足しても新規種が最新になる。
 */
async function stampAddedDates(
  resolved: ResolvedSpecies[],
): Promise<AddedLedger> {
  const ledger: AddedLedger = JSON.parse(
    await readFile(ADDED_DATES_PATH, 'utf8').catch(() => '{}'),
  )
  let maxSeq = Object.values(ledger).reduce((m, r) => Math.max(m, r.seq), 0)
  const today = new Date().toISOString().slice(0, 10)
  let added = 0
  // resolved.json はシード順（追加順）を保持しているので、その順で初回採番。
  for (const s of resolved) {
    if (!ledger[s.id]) {
      ledger[s.id] = { seq: ++maxSeq, date: today }
      added++
    }
  }
  await mkdir(dirname(ADDED_DATES_PATH), { recursive: true })
  await writeFile(ADDED_DATES_PATH, JSON.stringify(ledger, null, 2), 'utf8')
  if (added > 0) console.log(`  追加日を新規 ${added} 種に記録（${today}）`)
  return ledger
}

async function main() {
  const raw = await readFile(RESOLVED_PATH, 'utf8').catch(() => {
    throw new Error(
      `${RESOLVED_PATH} がありません。先に \`npm run resolve:taxa\` を実行してください。`,
    )
  })
  const resolved = JSON.parse(raw) as ResolvedSpecies[]
  console.log(`▶ ${resolved.length} 種からツリーを構築します`)

  const tree = buildTaxonTree(resolved)

  // 追加日・追加順を付与（buildTaxonTree は純粋なまま、ここで刻む）。
  const ledger = await stampAddedDates(resolved)
  for (const node of Object.values(tree.nodes)) {
    if (node.rank !== 'SPECIES') continue
    const rec = ledger[node.id]
    if (rec) {
      node.addedAt = rec.date
      node.addedSeq = rec.seq
    }
  }

  const nodeCount = Object.keys(tree.nodes).length
  const speciesCount = Object.values(tree.nodes).filter(
    (n) => n.rank === 'SPECIES',
  ).length

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(tree), 'utf8')
  // アプリ内追加のマージ再構築用に、入力 ResolvedSpecies[] もバンドルへ。
  // 祖先(内部ノード)の description/wikipedia は表示に使わないので落として軽量化。
  const slim = resolved.map((s) => ({
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
  }))
  await writeFile(RESOLVED_BUNDLE_PATH, JSON.stringify(slim), 'utf8')

  const root = tree.nodes[tree.rootId]
  console.log(`✔ ${OUT_PATH}`)
  console.log(`  ルート: ${root.names.ja || root.scientificName} (${root.rank})`)
  console.log(`  ノード総数: ${nodeCount}（うち種 ${speciesCount}）`)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
