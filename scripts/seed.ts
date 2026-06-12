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
  { ja: 'リュウガン（ロンガン）', en: 'Longan', sci: 'Dimocarpus longan' },
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

  // ── 東南アジアのフルーツ ──
  // モクレン目 Magnoliales / バンレイシ科 Annonaceae（系統樹に新しい目が生える）
  { ja: 'サワーソップ（トゲバンレイシ）', en: 'Soursop', sci: 'Annona muricata' },
  { ja: 'バンレイシ（釈迦頭）', en: 'Sugar apple', sci: 'Annona squamosa' },
  { ja: 'チェリモヤ', en: 'Cherimoya', sci: 'Annona cherimola' },
  { ja: 'アテモヤ', en: 'Atemoya', sci: 'Annona atemoya' },

  // アオイ目 Malvales / アオイ科
  { ja: 'ドリアン', en: 'Durian', sci: 'Durio zibethinus' },

  // バラ目 Rosales / クワ科（イチジク・クワと同科の別属）
  { ja: 'ジャックフルーツ（パラミツ）', en: 'Jackfruit', sci: 'Artocarpus heterophyllus' },
  { ja: 'パンノキ', en: 'Breadfruit', sci: 'Artocarpus altilis' },
  // バラ目 / クロウメモドキ科
  { ja: 'インドナツメ', en: 'Indian jujube', sci: 'Ziziphus mauritiana' },

  // ムクロジ目 Sapindales / センダン科（ミカン・マンゴー・ライチと同目の別科）
  { ja: 'ランサット（ドゥク）', en: 'Langsat', sci: 'Lansium parasiticum' },
  { ja: 'サントール', en: 'Santol', sci: 'Sandoricum koetjape' },
  // ムクロジ目 / ウルシ科（マンゴーと同科の別属）
  { ja: 'アンブレラフルーツ（アムラ）', en: 'Ambarella', sci: 'Spondias dulcis' },
  // ムクロジ目 / ミカン科（柑橘の仲間）
  { ja: 'ザボン（ポメロ）', en: 'Pomelo', sci: 'Citrus maxima' },

  // アブラナ目 Brassicales / パパイア科
  { ja: 'パパイヤ', en: 'Papaya', sci: 'Carica papaya' },

  // カタバミ目 Oxalidales / カタバミ科
  { ja: 'スターフルーツ（ゴレンシ）', en: 'Starfruit', sci: 'Averrhoa carambola' },

  // マメ目 Fabales / マメ科
  { ja: 'タマリンド', en: 'Tamarind', sci: 'Tamarindus indica' },

  // フトモモ目 Myrtales / フトモモ科（レンブ・グアバと同目）
  { ja: 'ジャワフトモモ（ジャンボラン）', en: 'Java plum', sci: 'Syzygium cumini' },

  // ヤシ目 Arecales / ヤシ科（サラク・ナツメヤシと同科）
  { ja: 'ココヤシ（ココナッツ）', en: 'Coconut', sci: 'Cocos nucifera' },

  // ── インドネシア・シンガポール・マレー諸島の特産 ──
  // クワ科 Artocarpus（ジャックフルーツと同属）
  { ja: 'チェンペダック（Cempedak）', en: 'Cempedak', sci: 'Artocarpus integer' },
  { ja: 'マラン（Marang/Terap）', en: 'Marang', sci: 'Artocarpus odoratissimus' },
  // ムクロジ科（ランブータン・リュウガンと同科）
  { ja: 'プラサン（Pulasan）', en: 'Pulasan', sci: 'Nephelium ramboutan-ake' },
  { ja: 'マトア（Matoa, パプア特産）', en: 'Matoa', sci: 'Pometia pinnata' },
  // ウルシ科（マンゴーと同科）
  { ja: 'ガンダリア（Gandaria）', en: 'Gandaria', sci: 'Bouea macrophylla' },
  { ja: 'バチャン（馬マンゴー, Bacang）', en: 'Horse mango', sci: 'Mangifera foetida' },
  { ja: 'カシューアップル（Jambu monyet）', en: 'Cashew apple', sci: 'Anacardium occidentale' },
  // カタバミ科（スターフルーツと同属）
  { ja: 'ビリンビ（Belimbing wuluh）', en: 'Bilimbi', sci: 'Averrhoa bilimbi' },
  // フトモモ科（レンブ・ジャワフトモモと同属）
  { ja: 'マレーフトモモ（Jambu bol）', en: 'Malay apple', sci: 'Syzygium malaccense' },
  { ja: 'ローズアップル（Jambu mawar）', en: 'Rose apple', sci: 'Syzygium jambos' },
  // バンレイシ科（サワーソップ等と同科）
  { ja: 'ギュウシンリ（牛心梨, Buah nona）', en: "Bullock's heart", sci: 'Annona reticulata' },
  { ja: 'クペル（Kepel, ジャワ王宮の果実）', en: 'Kepel apple', sci: 'Stelechocarpus burahol' },
  // フクギ科（マンゴスチンと同属）
  { ja: 'ムンドゥ（Mundu）', en: 'Mundu', sci: 'Garcinia dulcis' },
  { ja: 'ボタンマンゴスチン（Cherapu）', en: 'Button mangosteen', sci: 'Garcinia prainiana' },
  // コミカンソウ科（キントラノオ目の新しい科）
  { ja: 'ビグナイ（Buni）', en: 'Bignay', sci: 'Antidesma bunius' },
  { ja: 'ランバイ（Rambai）', en: 'Rambai', sci: 'Baccaurea motleyana' },
  // ナス目 Solanales / ナス科（系統樹に新しい目が生える）
  { ja: 'ショクヨウホオズキ（Ciplukan）', en: 'Cape gooseberry', sci: 'Physalis peruviana' },
  // ミカン科（柑橘の仲間）
  { ja: 'ウッドアップル（Kawista）', en: 'Wood apple', sci: 'Limonia acidissima' },
  // アカテツ科（サポジラと同科）
  { ja: 'サオケチック（Sawo kecik）', en: 'Caqui', sci: 'Manilkara kauki' },
  // アオイ科（ドリアンと同属）
  { ja: 'ライ（Lai, ボルネオドリアン）', en: 'Red-fleshed durian', sci: 'Durio kutejensis' },
]
