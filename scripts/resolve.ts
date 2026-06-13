/**
 * シード → ResolvedSpecies[] への解決（§7 ステップ2-3）。
 * GBIF で分類の幹を、Wikidata/MediaWiki で枝葉（和名・画像・説明）を付与する。
 * 結果は scripts/.cache/resolved.json に保存（build-taxa が読む）。
 *
 *   npm run resolve:taxa
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { RESOLVED_PATH } from './lib/paths'
import { seed } from './seed'
import { matchSpecies } from './pipeline/gbif'
import type { GbifMatch } from './pipeline/gbif'
import { metadataByGbifKeys } from './pipeline/wikidata'
import type { WikidataMeta } from './pipeline/wikidata'
import { extractsByTitles } from './pipeline/mediawiki'
import type { Extract } from './pipeline/mediawiki'
import { slugify } from './lib/slug'
import type { ResolvedRank, ResolvedSpecies } from '../lib/core/types'

async function main() {
  console.log(`▶ シード ${seed.length} 種を解決します\n`)

  // ── 1. GBIF で分類解決 ──
  const matched: { seed: (typeof seed)[number]; gbif: GbifMatch }[] = []
  const seenUsageKey = new Set<number>()
  for (const s of seed) {
    const m = await matchSpecies(s.sci)
    if (!m) {
      console.warn(`  ✗ NONE: ${s.sci}（${s.ja}）→ 手動確認が必要`)
      continue
    }
    const flag =
      m.matchType !== 'EXACT' || m.confidence < 90 ? ` ⚠ ${m.matchType}/${m.confidence}` : ''
    if (m.rank !== 'SPECIES') {
      console.warn(`  ✗ rank=${m.rank}: ${s.sci} → 種に解決できず（スキップ）`)
      continue
    }
    if (seenUsageKey.has(m.usageKey)) {
      console.warn(`  · 重複: ${s.sci} (usageKey=${m.usageKey})`)
      continue
    }
    seenUsageKey.add(m.usageKey)
    matched.push({ seed: s, gbif: m })
    console.log(`  ✓ ${s.sci} → ${m.canonicalName} #${m.usageKey}${flag}`)
  }
  console.log(`\n  解決成功: ${matched.length}/${seed.length}\n`)

  // ── 2. Wikidata（全 taxon キー：種＋祖先） ──
  const allKeys = new Set<number>()
  for (const { gbif } of matched) {
    allKeys.add(gbif.usageKey)
    for (const a of gbif.ancestors) allKeys.add(a.key)
  }
  console.log(`▶ Wikidata で ${allKeys.size} taxon のメタを取得中…`)
  const wd = await metadataByGbifKeys([...allKeys])
  console.log(`  和名/画像が得られた taxon: ${wd.size}\n`)

  // ── 3. MediaWiki 説明文抜粋（ja優先、無ければen） ──
  const jaTitles: string[] = []
  const enTitles: string[] = []
  for (const key of allKeys) {
    const m = wd.get(key)
    if (m?.jaTitle) jaTitles.push(m.jaTitle)
    else if (m?.enTitle) enTitles.push(m.enTitle)
  }
  console.log(`▶ MediaWiki 抜粋取得中（ja:${jaTitles.length} / en:${enTitles.length}）…`)
  const jaExtracts = await extractsByTitles('ja', jaTitles)
  const enExtracts = await extractsByTitles('en', enTitles)
  console.log(`  ja:${jaExtracts.size} en:${enExtracts.size}\n`)

  const extractFor = (m: WikidataMeta | undefined): Extract | undefined => {
    if (!m) return undefined
    if (m.jaTitle) return jaExtracts.get(m.jaTitle)
    if (m.enTitle) return enExtracts.get(m.enTitle)
    return undefined
  }

  // ── 4. ResolvedSpecies 組み立て ──
  const resolved: ResolvedSpecies[] = matched.map(({ seed: s, gbif }) => {
    const classification: ResolvedRank[] = gbif.ancestors.map((a) => {
      const m = wd.get(a.key)
      const ex = extractFor(m)
      return {
        rank: a.rank,
        id: slugify(a.name),
        scientificName: a.name,
        names: { ja: m?.ja ?? null, en: m?.en ?? a.name },
        imageUrl: m?.imageUrl ?? ex?.thumbnail ?? null,
        wikipediaUrl: ex?.wikipediaUrl ?? null,
        description: ex?.description ?? null,
      }
    })

    const m = wd.get(gbif.usageKey)
    const ex = extractFor(m)
    // 表示名は「常識的な和名」を最優先＝シードに書いた名前（括弧書きは別名へ）。
    // Wikidata の正式和名（例: レイシ・カキノキ・ヌマスノキ）は検索用の別名にまわす（§4.4）。
    const seedJa = s.ja.replace(/（.*?）/g, '').trim() || s.ja
    const chosenJa = seedJa
    // 括弧内は別名（「,、/」区切りで分割）。Wikidata 正式名・英名も別名に。
    const parenAliases = [...s.ja.matchAll(/（(.*?)）/g)].flatMap((mm) =>
      mm[1].split(/[,、/]/).map((x) => x.trim()),
    )
    const aliases = [
      ...new Set([m?.ja, s.en, ...parenAliases].filter(Boolean) as string[]),
    ].filter((a) => a !== chosenJa)
    return {
      id: slugify(gbif.canonicalName),
      scientificName: gbif.canonicalName,
      names: { ja: chosenJa, en: m?.en ?? s.en },
      imageUrl: m?.imageUrl ?? ex?.thumbnail ?? null,
      wikipediaUrl: ex?.wikipediaUrl ?? null,
      description: ex?.description ?? null,
      searchAliases: aliases.length ? aliases : undefined,
      classification,
    }
  })

  await mkdir(dirname(RESOLVED_PATH), { recursive: true })
  await writeFile(RESOLVED_PATH, JSON.stringify(resolved, null, 2), 'utf8')
  console.log(`✔ ${resolved.length} 種を ${RESOLVED_PATH} に保存しました`)

  // カバレッジ要約（§7.3）
  const withJa = resolved.filter((r) => r.names.ja).length
  const withImg = resolved.filter((r) => r.imageUrl).length
  const withDesc = resolved.filter((r) => r.description).length
  console.log(
    `\n── カバレッジ ──\n  和名: ${withJa}/${resolved.length}\n  画像: ${withImg}/${resolved.length}\n  説明: ${withDesc}/${resolved.length}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
