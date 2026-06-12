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
import { RESOLVED_PATH, TAXA_OUT_PATH as OUT_PATH } from './lib/paths'

async function main() {
  const raw = await readFile(RESOLVED_PATH, 'utf8').catch(() => {
    throw new Error(
      `${RESOLVED_PATH} がありません。先に \`npm run resolve:taxa\` を実行してください。`,
    )
  })
  const resolved = JSON.parse(raw) as ResolvedSpecies[]
  console.log(`▶ ${resolved.length} 種からツリーを構築します`)

  const tree = buildTaxonTree(resolved)
  const nodeCount = Object.keys(tree.nodes).length
  const speciesCount = Object.values(tree.nodes).filter(
    (n) => n.rank === 'SPECIES',
  ).length

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(tree), 'utf8')

  const root = tree.nodes[tree.rootId]
  console.log(`✔ ${OUT_PATH}`)
  console.log(`  ルート: ${root.names.ja || root.scientificName} (${root.rank})`)
  console.log(`  ノード総数: ${nodeCount}（うち種 ${speciesCount}）`)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
