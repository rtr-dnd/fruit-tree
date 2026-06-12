// 可食フルーツのシードリスト（§7.1）。学名を正とし GBIF で裏取りする。
// 採用＝ここに収録（可食判定は人間が実施 / §15）。多様な目・科を含め、
// 特にツツジ目(Ericales)を厚めにして「隣の枝」体験を作る（§2.2）。

export interface SeedFruit {
  ja: string
  en: string
  sci: string
}

export const seed: SeedFruit[] = [
  // ── ツツジ目 Ericales（黄金果の仲間。アカテツ科を厚めに） ──
  { ja: '黄金果（アビウ）', en: 'Abiu', sci: 'Pouteria caimito' },
  { ja: 'カニステル', en: 'Canistel', sci: 'Pouteria campechiana' },
  { ja: 'マメイサポテ', en: 'Mamey sapote', sci: 'Pouteria sapota' },
  { ja: 'サポジラ（チューインガムノキ）', en: 'Sapodilla', sci: 'Manilkara zapota' },
  { ja: 'スターアップル', en: 'Star apple', sci: 'Chrysophyllum cainito' },
  { ja: 'ミラクルフルーツ', en: 'Miracle fruit', sci: 'Synsepalum dulcificum' },
  { ja: '柿', en: 'Japanese persimmon', sci: 'Diospyros kaki' },
  { ja: 'マベ柿（黒柿）', en: 'Velvet apple', sci: 'Diospyros blancoi' },
  { ja: 'キウイフルーツ', en: 'Kiwifruit', sci: 'Actinidia chinensis' },
  { ja: 'サルナシ', en: 'Hardy kiwi', sci: 'Actinidia arguta' },
  { ja: 'ブルーベリー', en: 'Blueberry', sci: 'Vaccinium corymbosum' },
  { ja: 'ブラジルナッツ', en: 'Brazil nut', sci: 'Bertholletia excelsa' },

  // ── ムクロジ目 Sapindales（ライチ。黄金果とは目が異なる＝遠い） ──
  { ja: 'ライチ', en: 'Lychee', sci: 'Litchi chinensis' },
  { ja: 'リュウガン', en: 'Longan', sci: 'Dimocarpus longan' },
  { ja: 'ランブータン', en: 'Rambutan', sci: 'Nephelium lappaceum' },
  { ja: 'マンゴー', en: 'Mango', sci: 'Mangifera indica' },
  { ja: 'ウンシュウミカン', en: 'Mandarin orange', sci: 'Citrus reticulata' },
  { ja: 'ネーブルオレンジ', en: 'Sweet orange', sci: 'Citrus sinensis' },

  // ── バラ目 Rosales ──
  { ja: 'リンゴ', en: 'Apple', sci: 'Malus domestica' },
  { ja: 'ニホンナシ', en: 'Nashi pear', sci: 'Pyrus pyrifolia' },
  { ja: 'モモ', en: 'Peach', sci: 'Prunus persica' },
  { ja: 'オウトウ（さくらんぼ）', en: 'Cherry', sci: 'Prunus avium' },
  { ja: 'イチゴ', en: 'Strawberry', sci: 'Fragaria ananassa' },
  { ja: 'イチジク', en: 'Fig', sci: 'Ficus carica' },
  { ja: 'クワ（マルベリー）', en: 'Mulberry', sci: 'Morus alba' },

  // ── フトモモ目 Myrtales ──
  { ja: 'グアバ', en: 'Guava', sci: 'Psidium guajava' },
  { ja: 'ジャボチカバ', en: 'Jaboticaba', sci: 'Plinia cauliflora' },
  { ja: 'レンブ（ワックスアップル）', en: 'Wax apple', sci: 'Syzygium samarangense' },
  { ja: 'ザクロ', en: 'Pomegranate', sci: 'Punica granatum' },

  // ── キントラノオ目 Malpighiales ──
  { ja: 'パッションフルーツ', en: 'Passion fruit', sci: 'Passiflora edulis' },
  { ja: 'マンゴスチン', en: 'Mangosteen', sci: 'Garcinia mangostana' },
  { ja: 'アセロラ', en: 'Acerola', sci: 'Malpighia emarginata' },

  // ── クスノキ目 / ブドウ目 / ナデシコ目 ──
  { ja: 'アボカド', en: 'Avocado', sci: 'Persea americana' },
  { ja: 'ブドウ', en: 'Grape', sci: 'Vitis vinifera' },
  { ja: 'ドラゴンフルーツ', en: 'Dragon fruit', sci: 'Selenicereus undatus' },

  // ── ウリ目 Cucurbitales ──
  { ja: 'メロン', en: 'Melon', sci: 'Cucumis melo' },
  { ja: 'スイカ', en: 'Watermelon', sci: 'Citrullus lanatus' },

  // ── 単子葉（黄金果からは綱が異なる＝遠い） ──
  { ja: 'バナナ', en: 'Banana', sci: 'Musa acuminata' },
  { ja: 'パイナップル', en: 'Pineapple', sci: 'Ananas comosus' },
  { ja: 'ナツメヤシ（デーツ）', en: 'Date palm', sci: 'Phoenix dactylifera' },
  { ja: 'サラク（スネークフルーツ）', en: 'Salak', sci: 'Salacca zalacca' },
]
