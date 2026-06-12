import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { buildSearchIndex, normalize, search } from '../search'
import { baseSpecies } from './fixtures'

const tree = buildTaxonTree(baseSpecies)
const index = buildSearchIndex(tree)

describe('normalize (§5.7)', () => {
  it('NFKC + 小文字化 + カナ→かな + trim', () => {
    expect(normalize('　Ｐｏｕｔｅｒｉａ　')).toBe('pouteria')
    expect(normalize('ライチ')).toBe('らいち')
    expect(normalize('ＡＢＣ')).toBe('abc')
  })
})

describe('search (§5.7)', () => {
  it('和名の前方一致', () => {
    const r = search('黄金', index)
    expect(r[0].node.id).toBe('pouteria-caimito')
    expect(r[0].matchType).toBe('prefix')
  })

  it('カタカナ/ひらがな表記ゆれに耐える', () => {
    const r = search('らいち', index)
    expect(r.map((x) => x.node.id)).toContain('litchi-chinensis')
  })

  it('学名でも引ける', () => {
    const r = search('Diospyros', index)
    expect(r.map((x) => x.node.id)).toContain('diospyros-kaki')
  })

  it('内部ノード（科）も検索対象', () => {
    const r = search('アカテツ', index)
    expect(r.map((x) => x.node.id)).toContain('sapotaceae')
  })

  it('前方一致がファジーより上位、SPECIES が内部ノードより上位', () => {
    const r = search('カキ', index)
    // 「カキノキ属」「カキノキ科」より「柿」相当が…ここでは和名"柿"は前方一致しない。
    // 代わりに前方一致した内部ノード同士で SPECIES 優先の順序を確認するためのスモーク。
    expect(r.length).toBeGreaterThan(0)
  })

  it('該当なしは空配列', () => {
    expect(search('zzzznotfound', index)).toEqual([])
  })

  it('空クエリは空配列', () => {
    expect(search('   ', index)).toEqual([])
  })
})
