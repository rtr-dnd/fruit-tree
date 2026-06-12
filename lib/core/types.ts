// 分類ランク（界→種）。仕様 §6.1。
export type Rank =
  | 'KINGDOM'
  | 'PHYLUM'
  | 'CLASS'
  | 'ORDER'
  | 'FAMILY'
  | 'GENUS'
  | 'SPECIES'

export interface NodeNames {
  ja?: string | null
  en?: string | null
}

// 静的分類ツリーのノード（§6.1 TaxonNode）。
export interface TaxonNode {
  id: string
  rank: Rank
  scientificName: string
  names: NodeNames
  parentId: string | null
  childrenIds: string[]
  /** 祖先IDの配列（root→parent、自分は含まない）。パンくず用。 */
  lineage: string[]
  /** ランク→祖先ID。近さ判定用（§5.1）。欠落ランクはキー省略。 */
  ancestors: Partial<Record<Rank, string>>
  /** 葉=採用した可食フルーツの種。 */
  isEdibleFruit: boolean
  imageUrl: string | null
  wikipediaUrl: string | null
  description: string | null
  /** 内部ノードのみ：配下の採用種数（§5.5 分母の事前計算）。 */
  speciesCountUnder: number
  /** 内部ノードのみ：果物プレビュー用の未食代表（§5.6）。 */
  representativeSpeciesIds: string[]
  /** 別名（検索の表記ゆれ耐性用 / §4.4）。例: レイシ に対する「ライチ」。 */
  searchAliases?: string[]
}

export interface TaxonTree {
  rootId: string
  nodes: Record<string, TaxonNode>
}

// ── データパイプライン（§7）の解決結果。buildTaxonTree の入力（§5.4）。 ──

/** 解決済みの祖先ランク1つ分。 */
export interface ResolvedRank {
  rank: Rank
  /** 安定ID（GBIF key 由来の slug など）。 */
  id: string
  scientificName: string
  names?: NodeNames
  imageUrl?: string | null
  wikipediaUrl?: string | null
  description?: string | null
}

/** 1つの採用種＋その上位分類（KINGDOM→GENUS、種自身は classification に含めない）。 */
export interface ResolvedSpecies {
  id: string
  scientificName: string
  names: NodeNames
  imageUrl?: string | null
  wikipediaUrl?: string | null
  description?: string | null
  /** 検索の別名（§4.4）。 */
  searchAliases?: string[]
  /** root→parent の順（KINGDOM … GENUS）。欠落ランクは飛ばしてよい。 */
  classification: ResolvedRank[]
}

// ── ユーザー記録（§6.2 fruit_log）。 ──
export interface FruitLogEntry {
  taxonId: string
  tried: boolean
  rating?: number | null
  notes?: string | null
  place?: string | null
  /** ISO 日付 (YYYY-MM-DD)。 */
  triedDate?: string | null
  /** ISO タイムスタンプ。ラストライトウィン用（§11）。 */
  updatedAt: string
}

/** taxonId をキーにした記録の集合。 */
export type FruitLog = Map<string, FruitLogEntry>
