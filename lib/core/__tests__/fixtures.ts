import type { FruitLog, FruitLogEntry, ResolvedRank, ResolvedSpecies } from '../types'

// 共通の上位分類ノード（id / 学名 / 和名）。
const R = {
  plantae: { rank: 'KINGDOM', id: 'plantae', scientificName: 'Plantae', names: { ja: '植物界' } },
  tracheophyta: { rank: 'PHYLUM', id: 'tracheophyta', scientificName: 'Tracheophyta', names: { ja: '維管束植物門' } },
  magnoliopsida: { rank: 'CLASS', id: 'magnoliopsida', scientificName: 'Magnoliopsida', names: { ja: '双子葉植物綱' } },
  liliopsida: { rank: 'CLASS', id: 'liliopsida', scientificName: 'Liliopsida', names: { ja: '単子葉植物綱' } },
  ericales: { rank: 'ORDER', id: 'ericales', scientificName: 'Ericales', names: { ja: 'ツツジ目' } },
  sapindales: { rank: 'ORDER', id: 'sapindales', scientificName: 'Sapindales', names: { ja: 'ムクロジ目' } },
  poales: { rank: 'ORDER', id: 'poales', scientificName: 'Poales', names: { ja: 'イネ目' } },
  sapotaceae: { rank: 'FAMILY', id: 'sapotaceae', scientificName: 'Sapotaceae', names: { ja: 'アカテツ科' } },
  ebenaceae: { rank: 'FAMILY', id: 'ebenaceae', scientificName: 'Ebenaceae', names: { ja: 'カキノキ科' } },
  sapindaceae: { rank: 'FAMILY', id: 'sapindaceae', scientificName: 'Sapindaceae', names: { ja: 'ムクロジ科' } },
  bromeliaceae: { rank: 'FAMILY', id: 'bromeliaceae', scientificName: 'Bromeliaceae', names: { ja: 'パイナップル科' } },
  pouteria: { rank: 'GENUS', id: 'pouteria', scientificName: 'Pouteria', names: { ja: 'アカテツ属' } },
  manilkara: { rank: 'GENUS', id: 'manilkara', scientificName: 'Manilkara', names: { ja: 'マニルカラ属' } },
  diospyros: { rank: 'GENUS', id: 'diospyros', scientificName: 'Diospyros', names: { ja: 'カキノキ属' } },
  litchi: { rank: 'GENUS', id: 'litchi', scientificName: 'Litchi', names: { ja: 'レイシ属' } },
  ananas: { rank: 'GENUS', id: 'ananas', scientificName: 'Ananas', names: { ja: 'アナナス属' } },
} satisfies Record<string, ResolvedRank>

function species(
  id: string,
  ja: string,
  en: string,
  sci: string,
  classification: ResolvedRank[],
): ResolvedSpecies {
  return {
    id,
    scientificName: sci,
    names: { ja, en },
    imageUrl: `https://example.test/${id}.jpg`,
    classification,
  }
}

// アビウ（黄金果）：ツツジ目 アカテツ科 アカテツ属
export const abiu = species('pouteria-caimito', '黄金果', 'Abiu', 'Pouteria caimito', [
  R.plantae, R.tracheophyta, R.magnoliopsida, R.ericales, R.sapotaceae, R.pouteria,
])
// カニステル：同じアカテツ属 → 黄金果と同属
export const canistel = species('pouteria-campechiana', 'カニステル', 'Canistel', 'Pouteria campechiana', [
  R.plantae, R.tracheophyta, R.magnoliopsida, R.ericales, R.sapotaceae, R.pouteria,
])
// サポジラ：同じアカテツ科の別属 → 黄金果と同科
export const sapodilla = species('manilkara-zapota', 'サポジラ', 'Sapodilla', 'Manilkara zapota', [
  R.plantae, R.tracheophyta, R.magnoliopsida, R.ericales, R.sapotaceae, R.manilkara,
])
// 柿：同じツツジ目の別科（カキノキ科）→ 黄金果と同目（隣の枝）
export const kaki = species('diospyros-kaki', '柿', 'Japanese persimmon', 'Diospyros kaki', [
  R.plantae, R.tracheophyta, R.magnoliopsida, R.ericales, R.ebenaceae, R.diospyros,
])
// ライチ：ムクロジ目 → 黄金果とは目が異なる（遠い / FAR）
export const litchi = species('litchi-chinensis', 'ライチ', 'Lychee', 'Litchi chinensis', [
  R.plantae, R.tracheophyta, R.magnoliopsida, R.sapindales, R.sapindaceae, R.litchi,
])
// パイナップル：単子葉（イネ目）→ 綱が異なる。LCA を押し上げるテスト用。
export const pineapple = species('ananas-comosus', 'パイナップル', 'Pineapple', 'Ananas comosus', [
  R.plantae, R.tracheophyta, R.liliopsida, R.poales, R.bromeliaceae, R.ananas,
])

/** §14 の基本採用集合（黄金果・柿・ライチ＋同科/同属の仲間）。 */
export const baseSpecies: ResolvedSpecies[] = [
  abiu, canistel, sapodilla, kaki, litchi,
]

export function makeLog(entries: Partial<FruitLogEntry>[]): FruitLog {
  const log: FruitLog = new Map()
  for (const e of entries) {
    log.set(e.taxonId!, {
      taxonId: e.taxonId!,
      tried: e.tried ?? true,
      form: e.form ?? null,
      rating: e.rating ?? null,
      notes: e.notes ?? null,
      place: e.place ?? null,
      triedDate: e.triedDate ?? null,
      updatedAt: e.updatedAt ?? '2026-01-01T00:00:00Z',
    })
  }
  return log
}
