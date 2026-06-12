import { closenessLabel, sharedLowestRank } from './closeness'
import { nodeLabel } from './tree'
import type { FruitLog, Rank, TaxonNode, TaxonTree } from './types'

export interface RelationshipItem {
  node: TaxonNode
  tried: boolean
  closeness: string
}

export interface RelationshipGroup {
  /** 見出しノードのID（属/科）。groupBy=none のときは空。 */
  id: string
  headingLabel: string
  node: TaxonNode | null
  items: RelationshipItem[]
  triedCount: number
  /** 一度も食べていない近縁グループ（§5.3）。 */
  untrodden: boolean
}

export interface RelationshipSection {
  bucket: 'GENUS' | 'FAMILY' | 'ORDER'
  label: string
  /** true のとき groups を見出しで分割して表示。 */
  grouped: boolean
  groups: RelationshipGroup[]
}

export interface RelationshipList {
  focusId: string
  sections: RelationshipSection[]
  /** 目より遠い「より遠い仲間」の件数（§4.2 で畳む）。 */
  furtherCount: number
}

const BUCKET_LABEL: Record<RelationshipSection['bucket'], string> = {
  GENUS: '同じ属の仲間',
  FAMILY: '同じ科の別の属',
  ORDER: '同じ目の別の科',
}

function byUntroddenThenName(
  aUntrodden: boolean,
  bUntrodden: boolean,
  aName: string,
  bName: string,
): number {
  // 未踏を上、その後 和名昇順（§5.3 ソート規則）。
  if (aUntrodden !== bUntrodden) return aUntrodden ? -1 : 1
  return aName.localeCompare(bName, 'ja')
}

function buildSection(
  bucket: RelationshipSection['bucket'],
  members: TaxonNode[],
  groupByRank: Rank | null,
  tree: TaxonTree,
  log: FruitLog,
  focus: TaxonNode,
): RelationshipSection {
  const groupMap = new Map<string, RelationshipItem[]>()

  for (const s of members) {
    const groupId = groupByRank ? s.ancestors[groupByRank] ?? '' : ''
    const item: RelationshipItem = {
      node: s,
      tried: !!log.get(s.id)?.tried,
      closeness: closenessLabel(sharedLowestRank(focus, s)),
    }
    const list = groupMap.get(groupId)
    if (list) list.push(item)
    else groupMap.set(groupId, [item])
  }

  const groups: RelationshipGroup[] = [...groupMap.entries()].map(
    ([groupId, items]) => {
      const node = groupId ? tree.nodes[groupId] ?? null : null
      const triedCount = items.filter((i) => i.tried).length
      items.sort((a, b) =>
        byUntroddenThenName(!a.tried, !b.tried, nodeLabel(a.node), nodeLabel(b.node)),
      )
      return {
        id: groupId,
        headingLabel: node ? nodeLabel(node) : '',
        node,
        items,
        triedCount,
        untrodden: triedCount === 0,
      }
    },
  )

  groups.sort((a, b) =>
    byUntroddenThenName(a.untrodden, b.untrodden, a.headingLabel, b.headingLabel),
  )

  return { bucket, label: BUCKET_LABEL[bucket], grouped: groupByRank != null, groups }
}

/**
 * 関係リスト生成（§5.3 / §4.2 の核）。
 * 近い順（GENUS→FAMILY→ORDER）にバケット化し、枝分かれランクで見出しグルーピング。
 */
export function buildRelationshipList(
  focusId: string,
  tree: TaxonTree,
  log: FruitLog,
): RelationshipList {
  const focus = tree.nodes[focusId]
  if (!focus) throw new Error(`buildRelationshipList: unknown id ${focusId}`)

  const buckets: Record<RelationshipSection['bucket'], TaxonNode[]> = {
    GENUS: [],
    FAMILY: [],
    ORDER: [],
  }
  let furtherCount = 0

  for (const node of Object.values(tree.nodes)) {
    if (node.rank !== 'SPECIES' || node.id === focusId) continue
    const r = sharedLowestRank(focus, node)
    if (r === 'GENUS' || r === 'FAMILY' || r === 'ORDER') {
      buckets[r].push(node)
    } else {
      // FAR（目より上でしか一致しない）= より遠い仲間として畳む（§4.2）
      furtherCount++
    }
  }

  const sections: RelationshipSection[] = [
    buildSection('GENUS', buckets.GENUS, null, tree, log, focus),
    buildSection('FAMILY', buckets.FAMILY, 'GENUS', tree, log, focus),
    buildSection('ORDER', buckets.ORDER, 'FAMILY', tree, log, focus),
  ].filter((s) => s.groups.length > 0)

  return { focusId, sections, furtherCount }
}
