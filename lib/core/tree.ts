import type {
  NodeNames,
  Rank,
  ResolvedRank,
  ResolvedSpecies,
  TaxonNode,
  TaxonTree,
} from './types'

/** 内部ノードの representativeSpeciesIds に詰める最大件数（§5.6）。 */
const MAX_REPRESENTATIVES = 6

interface ChainEntry {
  rank: Rank
  id: string
  scientificName: string
  names: NodeNames
  imageUrl: string | null
  wikipediaUrl: string | null
  description: string | null
  searchAliases?: string[]
}

function toChainEntry(r: ResolvedRank): ChainEntry {
  return {
    rank: r.rank,
    id: r.id,
    scientificName: r.scientificName,
    names: r.names ?? {},
    imageUrl: r.imageUrl ?? null,
    wikipediaUrl: r.wikipediaUrl ?? null,
    description: r.description ?? null,
  }
}

function speciesAsChainEntry(s: ResolvedSpecies): ChainEntry {
  return {
    rank: 'SPECIES',
    id: s.id,
    scientificName: s.scientificName,
    names: s.names ?? {},
    imageUrl: s.imageUrl ?? null,
    wikipediaUrl: s.wikipediaUrl ?? null,
    description: s.description ?? null,
    searchAliases: s.searchAliases,
  }
}

/** root→leaf の祖先ID＋種ID。 */
function rootToLeafChain(s: ResolvedSpecies): ChainEntry[] {
  return [...s.classification.map(toChainEntry), speciesAsChainEntry(s)]
}

/** 全パスの最長共通接頭辞の長さ（ID同一性で比較）。 */
function longestCommonPrefixLength(paths: string[][]): number {
  if (paths.length === 0) return 0
  let len = paths[0].length
  for (const p of paths.slice(1)) {
    len = Math.min(len, p.length)
    let i = 0
    while (i < len && p[i] === paths[0][i]) i++
    len = i
    if (len === 0) break
  }
  return len
}

function displayName(n: { names: NodeNames; scientificName: string }): string {
  return n.names.ja || n.names.en || n.scientificName
}

/**
 * 採用集合 → 分類ツリー（§5.4）。純関数。
 * - 全採用種の最小共通祖先（LCA）をルートにする。
 * - LCA〜葉のノードだけ残す（フォーカス外の科・目は持たない）。
 * - lineage / childrenIds / ancestors / speciesCountUnder / representativeSpeciesIds を埋める。
 */
export function buildTaxonTree(resolved: ResolvedSpecies[]): TaxonTree {
  if (resolved.length === 0) {
    throw new Error('buildTaxonTree: 採用種が空です')
  }

  const chains = resolved.map(rootToLeafChain)
  const paths = chains.map((c) => c.map((e) => e.id))

  // LCA = 最長共通接頭辞の最後の要素
  const lcpLen = longestCommonPrefixLength(paths)
  if (lcpLen === 0) {
    throw new Error('buildTaxonTree: 採用種に共通の祖先がありません（界が異なる？）')
  }
  const lcaIndex = lcpLen - 1
  const rootId = paths[0][lcaIndex]

  // 各IDの代表メタ（最初に見たもの）。
  const meta = new Map<string, ChainEntry>()
  // 各IDの全祖先ランク→ID（フルチェーン。近さ判定はルートより上のランクも使うため間引かない / §5.1）。
  const ancestorsOf = new Map<string, Partial<Record<Rank, string>>>()
  // 親・子（採用集合内の隣接）。
  const parentOf = new Map<string, string | null>()
  const childrenOf = new Map<string, Set<string>>()

  for (const chain of chains) {
    const idx = chain.findIndex((e) => e.id === rootId)
    // rootId 以降だけ残す（LCA〜葉 / §5.4）。
    for (let j = idx; j < chain.length; j++) {
      const e = chain[j]
      if (!meta.has(e.id)) meta.set(e.id, e)

      // ancestors はフルチェーン（0..j-1）から構築。
      if (!ancestorsOf.has(e.id)) {
        const anc: Partial<Record<Rank, string>> = {}
        for (let k = 0; k < j; k++) anc[chain[k].rank] = chain[k].id
        ancestorsOf.set(e.id, anc)
      }

      const parent = j > idx ? chain[j - 1].id : null
      if (!parentOf.has(e.id)) parentOf.set(e.id, parent)
      if (!childrenOf.has(e.id)) childrenOf.set(e.id, new Set())
      if (j + 1 < chain.length) childrenOf.get(e.id)!.add(chain[j + 1].id)
    }
  }

  // ノード組み立て（speciesCountUnder / representative は後段で）。
  const nodes: Record<string, TaxonNode> = {}
  for (const [id, e] of meta) {
    const childIds = [...(childrenOf.get(id) ?? [])].sort((a, b) =>
      displayName(meta.get(a)!).localeCompare(displayName(meta.get(b)!), 'ja'),
    )
    // lineage = rootId..parent（root→parent の順）。
    const lineage: string[] = []
    let cur = parentOf.get(id) ?? null
    while (cur != null) {
      lineage.unshift(cur)
      cur = parentOf.get(cur) ?? null
    }
    nodes[id] = {
      id,
      rank: e.rank,
      scientificName: e.scientificName,
      names: e.names,
      parentId: parentOf.get(id) ?? null,
      childrenIds: childIds,
      lineage,
      ancestors: ancestorsOf.get(id) ?? {},
      isEdibleFruit: e.rank === 'SPECIES',
      imageUrl: e.imageUrl,
      wikipediaUrl: e.wikipediaUrl,
      description: e.description,
      speciesCountUnder: 0,
      representativeSpeciesIds: [],
      ...(e.searchAliases && e.searchAliases.length
        ? { searchAliases: e.searchAliases }
        : {}),
    }
  }

  // 配下種の事前計算（メモ化 DFS）。
  const speciesCache = new Map<string, string[]>()
  function speciesUnder(id: string): string[] {
    const cached = speciesCache.get(id)
    if (cached) return cached
    const node = nodes[id]
    let result: string[]
    if (node.rank === 'SPECIES') {
      result = [id]
    } else {
      result = node.childrenIds.flatMap((c) => speciesUnder(c))
    }
    speciesCache.set(id, result)
    return result
  }

  for (const node of Object.values(nodes)) {
    if (node.rank === 'SPECIES') continue
    const species = speciesUnder(node.id)
    node.speciesCountUnder = species.length
    // 代表種：和名あり＋画像ありを優先、和名昇順で上位 MAX_REPRESENTATIVES（§5.6）。
    const scored = species
      .map((sid) => nodes[sid])
      .sort((a, b) => {
        const sa = (a.names.ja ? 0 : 1) + (a.imageUrl ? 0 : 1)
        const sb = (b.names.ja ? 0 : 1) + (b.imageUrl ? 0 : 1)
        if (sa !== sb) return sa - sb
        return displayName(a).localeCompare(displayName(b), 'ja')
      })
    node.representativeSpeciesIds = scored
      .slice(0, MAX_REPRESENTATIVES)
      .map((n) => n.id)
  }

  // ルートの parentId は null（§5.4）。
  nodes[rootId].parentId = null

  return { rootId, nodes }
}

/** 任意ノード配下の SPECIES ノードIDを列挙（葉なら自身）。 */
export function speciesUnder(tree: TaxonTree, nodeId: string): string[] {
  const node = tree.nodes[nodeId]
  if (!node) return []
  if (node.rank === 'SPECIES') return [nodeId]
  return node.childrenIds.flatMap((c) => speciesUnder(tree, c))
}

/** 表示名（和名 > 英名 > 学名）。 */
export function nodeLabel(node: TaxonNode): string {
  return node.names.ja || node.names.en || node.scientificName
}
