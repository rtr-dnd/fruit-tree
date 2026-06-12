# フルーツ系統樹トラッカー 仕様書 v1.0

> 旅先で珍しいフルーツを食べる人のための、分類系統（植物の分類階層）をたどりながら「食べた記録」を残せるモバイルWebアプリ。
> UI言語は日本語前提。

---

## 1. プロダクトの目的

旅先で出会った珍しいフルーツについて、

1. それが分類上どのグループに属し、自分の知っているフルーツ（例：柿）とどれくらい近いかを把握する
2. 同じ枝・隣の枝にどんなフルーツがあるかを簡単にたどれる
3. まだ一度も食べたことのない分類（＝未踏の枝）がどこかを把握する
4. 食べたフルーツに目印・感想・場所などを記録し、複数端末で共有する

を、Wikipediaを行き来する手間なしに実現する。

---

## 2. コアコンセプト：分類階層をナビゲーション可能な「木」として持つ

「系統樹」は、フルーツ単体の進化的距離（枝の長さを持つ厳密な系統樹）ではなく、**植物の分類階層（目 order → 科 family → 属 genus → 種 species）の入れ子構造**としてモデル化する。

理由：

- ユーザーの問い（「柿とどれくらい近いか」「隣に何があるか」「未踏の枝はどこか」）は、分類階層の入れ子で十分かつ正確に表現できる。
- 厳密な系統樹（分岐長付き cladogram）は可食フルーツ全体できれいに揃わない。分類階層なら主要 API から安定して取得できる。

### 2.1 近さの定義

2つのフルーツの「近さ」は、**共有する最下位の分類ランクの深さ**で定義する。

| 共有する最下位ランク | 関係 | 近さラベル |
|---|---|---|
| 同じ種 | 品種違い | 最も近い |
| 同じ属 (genus) | 近縁 | 近い（同属） |
| 同じ科 (family) | 同じ仲間 | やや近い（同科） |
| 同じ目 (order) | 隣の枝 | 中くらい（隣の枝・同目） |
| 同じ綱/門 | 遠い | 遠い |

### 2.2 ワークドエグザンプル（期待挙動の基準）

ユーザーが台湾で食べた「黄金果（アビウ, *Pouteria caimito*, アカテツ科 Sapotaceae）」を例にとる：

- 柿（*Diospyros kaki*, カキノキ科 Ebenaceae）とは **科は違うが同じツツジ目 Ericales** → アプリ上は「隣の枝（同じ目の別の科）」として提示。「似ている」という体感と一致する。
- ライチ（*Litchi chinensis*, ムクロジ科 Sapindaceae, ムクロジ目 Sapindales）とは **目が異なる** → 分類上はかなり遠い。「味のライチっぽさは系統ではなく偶然」と読み取れる UI にする（＝関係リストに現れない）。

→ 黄金果の詳細画面で「同じ科の仲間」「同じ目の別の科（柿はここ）」「未踏の近縁グループ」がワンタップで見えること、が受け入れ基準（§14）。

---

## 3. 主要ユースケース / ユーザーストーリー

1. 旅先で食べたフルーツを名前で検索 → 詳細を見る → 「食べた」マークと感想・場所を記録する。
2. あるフルーツの詳細から「同じ科の仲間」「隣の科」へツリーをたどり、次に試したい候補を探す。
3. ツリーの**未踏フィルタ**で、まだ一度も食べていない科・目だけを絞り込み、旅の目標を立てる（§4.1）。
4. 別の端末でログインし、記録を引き継いで閲覧・編集する。
5. 旅先でリストに無いフルーツに出会ったとき、それを追加する（§7.4）。

---

## 4. 機能要件

### 4.1 ツリーナビゲーション（ホーム）

分類階層を**1階層ずつドリルダウン**する形式（モバイルでは展開ツリーより読みやすい）。

- **ルート**は固定値ではなく、**収録フルーツ全体の最小共通祖先（LCA）**（ビルド時に算出、§5.4）。子が1つしかない中間ランクは、タップ数削減のため**表示上のみ**折りたたんで飛ばしてよい（任意。データは間引かない／§5.4）。
- **パンくず**を画面上部に表示（例：植物界 › ツツジ目 › アカテツ科 › Pouteria属 › 黄金果）。タップで任意の祖先に戻れる。
- 各ノード行に以下を表示：
  - **制覇バッジ**：配下の可食フルーツの「食べた数 / 総数」（例：アカテツ科 2/3）。
  - **果物プレビュー**：そのノードに含まれる**代表果物のサムネ3〜4個**（和名つき）。**食べた種を最優先**で並べ（＝記憶のアンカー：「柿が入っている科ね」）、枠が余れば認識しやすい未食種で埋める。食べた種は強調表示、未食はやや淡く。選定規則は §5.6。各サムネのタップでその果物の詳細へ。
  - 未踏ノード（食べた数 0）は視覚的に区別。
- ノードから：親へ戻る／子へ進む／兄弟（同階層の別ノード）へ移動。
- **未踏フィルタ（トグル）**：ON にすると、現在の階層で**食べた数が 0 の子ノードだけ**を残す（既に手をつけた枝を隠す）。画面上部に「未踏の科 N / 総 M」のカウントを表示。これにより「丸ごと未踏の枝」を絞り込んで旅の目標を立てられる（旧・未踏マップの役割を本フィルタが担う）。

> 設計判断：制覇率の俯瞰は当面この未踏フィルタで充足する。全体を一画面で見る俯瞰ビュー（treemap/sunburst 等）が必要になれば、同じ集計（§5.5）の上に別画面として後付けできる。

### 4.2 フルーツ詳細

- 画像、名前（和名 / 英名 / 学名）、完全なパンくず（種→属→科→目…）。
- **関係リスト（近い順、§5.3 で生成）**：
  - **同じ属の仲間**
  - **同じ科の別の属**
  - **同じ目の別の科**（＝隣の枝）
  - 各項目に近さラベル（§2.1）と、自分が食べたか否かのマーク。各グループには「未踏（一度も食べていない近縁グループ）」フラグ。
  - ※関係リストに出るのは**データセットに収録済みのフルーツ/分類のみ**。フォーカス外で DB に存在しない科・属は表示されない。目より遠い種は表示しない（または「より遠い仲間」として畳む）。
- 「食べた」トグル、評価（任意 1–5）、メモ（感想）、食べた場所、食べた日。
- Wikipedia 記事へのリンク、説明文の抜粋。

### 4.3 食べた記録・メモ

- 任意のフルーツ（種ノード）に対し tried フラグ・評価・メモ・場所・日付を保存。
- ログインユーザーに紐づけてクラウド保存し、複数端末で同期。

### 4.4 検索

- 和名 / 英名 / 学名でフルーツ・分類ノードを横断検索。
- 表記ゆれ耐性：正規化（NFKC ＋ かな畳み込み）＋前方一致＋あいまい一致（§5.7）。

### 4.5 認証・同期

- ログインは **Sign in with Google（OAuth）のみ**。メール＋パスワード認証は実装しない。
- 未ログイン時は**閲覧のみ可**。記録（食べたマーク・評価・メモ・場所）はログイン必須。
- ユーザーの記録のみをクラウド DB に保存。分類データ本体は読み取り専用の静的データなので DB に入れない。

---

## 5. アルゴリズム仕様（中核）

本章が本アプリの心臓部。§2 のワークドエグザンプルを満たすことが受け入れ基準（§14）。

### 5.1 前提：ランクは「キー」で比較する（位置で比較しない）

GBIF backbone はランクの欠落・単型中間ランクがあり得るため、`lineage` 配列の**位置（index）で祖先を突き合わせてはならない**。各 SPECIES ノードに**ランク→祖先 ID のマップ**を非正規化して持たせ（`ancestors`、§6.1）、常に**ランク名をキーに**比較する。

```jsonc
// SPECIES ノード（黄金果）の ancestors 例
"ancestors": { "ORDER": "ericales", "FAMILY": "sapotaceae", "GENUS": "pouteria" }
```

### 5.2 近さ判定：共有する最下位ランク

```
RANK_ORDER = [SPECIES, GENUS, FAMILY, ORDER, CLASS, PHYLUM]   // 下位→上位

sharedLowestRank(a, b):            // a, b は SPECIES ノード
  if a.id == b.id: return SPECIES
  for rank in RANK_ORDER[1:]:      // GENUS から上へ
    ka = a.ancestors[rank]; kb = b.ancestors[rank]
    if ka != null and kb != null and ka == kb:
      return rank                  // 最初に一致したランク = 最下位の共有ランク
  return FAR                       // 綱/門より上でしか一致しない = 遠い

closenessLabel(rank):
  GENUS  -> "近い（同属）"
  FAMILY -> "やや近い（同科）"
  ORDER  -> "中くらい（隣の枝・同目）"
  else   -> "遠い"
```

注：表の「同じ種＝品種違い（最も近い）」は、葉ノードが SPECIES である現スキーマでは通常発火しない。将来 cultivar を種以下ノードとして追加した場合のみ発火（§12）。

### 5.3 関係リスト生成（§4.2 の核）

フォーカス種 F の詳細画面の関係リストを、**近い順にバケット化**し、各バケット内を**枝分かれしたランクで見出しグルーピング**して生成する。

```
buildRelationshipList(F, allSpecies, fruitLog):
  buckets = { GENUS: [], FAMILY: [], ORDER: [] }            // 近い順
  for s in allSpecies where s.id != F.id:
    r = sharedLowestRank(F, s)
    if r in buckets: buckets[r].push(s)
    // r == FAR は「より遠い仲間」として畳む or 省略

  sections = []
  sections += group(buckets.GENUS,  label="同じ属の仲間",   groupBy=none)
  sections += group(buckets.FAMILY, label="同じ科の別の属", groupBy=GENUS)   // 属で見出し
  sections += group(buckets.ORDER,  label="同じ目の別の科", groupBy=FAMILY)  // 科で見出し（=隣の枝）

  for entry in sections.*.items:
    entry.tried     = fruitLog.has(entry.id)
    entry.closeness = closenessLabel(sharedLowestRank(F, entry))
  for g in sections.*.groups:
    g.triedCount = count(g.items where tried)
    g.untrodden  = (g.triedCount == 0)     // 一度も食べていない近縁グループ
  return sections
```

**ソート規則**：バケットは近い順（GENUS→FAMILY→ORDER）。グループ見出しは「未踏を上、その後 和名昇順」。グループ内の種も「未踏を上、その後 和名昇順」（試したい候補＝未踏を見つけやすく）。

**黄金果での期待出力**：「同じ科の別の属」＝他の Sapotaceae（属見出し）／「同じ目の別の科」に **Ebenaceae 見出し → 柿** が出現（「柿はここ」）／ライチは目が異なるためどのバケットにも現れない。

### 5.4 ルート決定（LCA）＋プルーニング

```
buildTaxonTree(resolvedSpecies):                 // 採用集合の純関数
  paths = [ rootToLeafKeys(s) for s in resolvedSpecies ]   // [kingdomKey, …, speciesKey]
  lca = lastElement(longestCommonPrefix(paths))            // 最小共通祖先（ノード同一性で比較）
  keep = set()
  for p in paths:
    i = indexOf(lca, p); keep ∪= p[i:]                     // lca〜葉だけ残す
  return assemble(keep, root=lca)                          // lca.parentId = null
```

- **性質**：採用集合の純関数。既存ルートの外側に種を足すと LCA が自動で上に移動し、新しい科・目の内部ノードが自動で生える（§7.4）。
- **単型チェーンの折りたたみ（§4.1 任意）は表示専用**：ドリルダウンで子が1つの中間ランクを UI 上スキップしてよいが、`ancestors`/`lineage` のデータは**間引かない**（近さ判定が壊れるため）。

### 5.5 制覇率・未踏判定（バッジ／未踏フィルタの基盤）

`fruit_log` を静的ツリーに突き合わせる派生ビュー。

```
coverage(node)  = triedSpeciesUnder(node, fruitLog) / totalSpeciesUnder(node)
untrodden(node) = (triedSpeciesUnder(node) == 0)
```

`totalSpeciesUnder` はビルド時にノードへ事前計算（`speciesCountUnder`）。`triedSpeciesUnder` のみ実行時に `fruit_log` から算出。制覇バッジ・未踏フィルタ（§4.1）はこれを使う。

### 5.6 果物プレビューの代表種選定（§4.1）

各ノード行に出すサムネを、**食べた種を最優先**で選ぶ。

```
representativePreview(node, fruitLog, k=4):
  eaten = speciesUnder(node) where fruitLog.has(id)
  eaten = sort eaten by (rating desc, triedDate desc)     // あなたのアンカー優先
  reps  = node.representativeSpeciesIds                    // ビルド時の未食代表（§6.1）
          filtered to (not eaten), keep curated order
  picks = (eaten ++ reps)[0:k]
  for p in picks: p.tried = fruitLog.has(p.id)
  return picks                                            // 食べた種は強調、未食は淡く
```

- 未踏ノード（eaten 空）でも `reps` から数件見せ、「ここに何があるか」を伝える。
- `representativeSpeciesIds` のビルド時選定：配下種のうち**和名あり＋画像あり**を優先し、上位約6件を採用（実行時に食べた種を上書きしても枠が埋まるよう余裕を持つ）。

### 5.7 検索（正規化・マッチング）

ビルド時に全ノード（SPECIES＋内部ノード）から検索インデックスを生成。

```
normalize(s):
  s = NFKC(s); s = toLowerCase(s); s = katakanaToHiragana(s); s = trim(s); return s
```

1. **前方一致**：正規化クエリで `ja/en/sci` の正規化済みフィールドを前方一致。
2. **あいまい一致**：Fuse.js を `keys=[ja,en,sci]`, `threshold≈0.35`, `ignoreLocation=true`, `minMatchCharLength=2` で実行。
3. **マージ＆順位付け**：前方一致＞あいまい。同点は SPECIES を内部ノードより上、次に和名昇順。重複は id で排除。

すべてバンドル済みデータ上でクライアント実行（外部 fetch なし）。

---

## 6. データモデル

### 6.1 分類ツリー（静的・読み取り専用）

ビルド時に生成し、アプリにバンドル（または静的配信）する。ナビゲーションのたびに外部 fetch はしない。

**TaxonNode**
```jsonc
{
  "id": "string",            // 安定ID（GBIF usageKey 由来のslug等）
  "rank": "ORDER|FAMILY|GENUS|SPECIES",
  "scientificName": "Pouteria caimito",
  "names": { "ja": "黄金果", "en": "Abiu" },
  "parentId": "string|null",
  "childrenIds": ["string"],
  "lineage": ["plantae", "ericales", "sapotaceae", "pouteria"], // 祖先IDの配列（パンくず用）
  "ancestors": { "ORDER": "ericales", "FAMILY": "sapotaceae", "GENUS": "pouteria" }, // ランク→ID（近さ判定用）。欠落ランクはキー省略
  "isEdibleFruit": true,     // 葉=採用フルーツ（シード収録＝採用。可食判定はデータ投入時に人間が行う）
  "imageUrl": "string|null",
  "wikipediaUrl": "string|null",
  "description": "string|null",
  "speciesCountUnder": 0,           // 内部ノードのみ：配下の採用種数（未踏マップ分母の事前計算）
  "representativeSpeciesIds": []    // 内部ノードのみ：果物プレビュー用の未食代表（§5.6）
}
```

- **葉ノード = 採用した可食フルーツの種**、内部ノード = 属・科・目などの上位分類。
- ツリーは採用フルーツ群の**最小共通祖先（LCA）をルート**とし、いずれかの採用フルーツの祖先になっているノードだけを含む（フォーカス外の科・目は DB に存在しない／§5.4）。
- 採用するか（＝今回の可食フルーツに含めるか）はシードリストへの収録時に人間が判断する。スキーマやツリー構造には可食判定ロジックを持たない。
- `ancestors` を持たせることで「同じ科か」「共有最下位ランク」を O(1) 近くで安定判定できる。

### 6.2 ユーザー記録（Supabase / Postgres）

ユーザー記録はログイン単位で隔離。RLS で自分の行のみ読み書き可能にする。

**fruit_log**
```sql
create table public.fruit_log (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  taxon_id    text        not null,              -- SPECIES ノードの id
  tried       boolean     not null default true,
  rating      smallint    check (rating between 1 and 5),
  notes       text,
  place       text,
  tried_date  date,
  updated_at  timestamptz not null default now(),
  primary key (user_id, taxon_id)
);

alter table public.fruit_log enable row level security;

create policy "fruit_log_own_rows"
  on public.fruit_log
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- `taxon_id` は静的ツリー側の ID（外部キーにはしない＝分類データは DB 外）。
- アップサートは PK `(user_id, taxon_id)` を競合キーに。`updated_at` はトリガ or クライアントで更新。
- 制覇率・未踏フィルタ（§5.5）は `fruit_log` を静的ツリーに突き合わせて算出する派生ビュー。

### 6.3 supplemental_taxa（将来・モデルB採用時のみ）

アプリ内追補（§7.4 モデルB）を実装する場合のみ作成。当面はユーザー単位スコープ。

```sql
create table public.supplemental_taxa (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  gbif_usage_key bigint      not null,
  resolved       jsonb       not null,   -- 解決済み ResolvedSpecies（lineage/names/image 等）
  created_at     timestamptz not null default now(),
  primary key (user_id, gbif_usage_key)
);

alter table public.supplemental_taxa enable row level security;

create policy "supplemental_taxa_own_rows"
  on public.supplemental_taxa
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 7. データパイプライン（ビルド時バッチ）

> 目的：可食フルーツの種リストを起点に、分類階層・名前・画像・説明を取得し、正規化済みの静的 JSON（§6.1）を出力する。**一度実行して固める**運用。リポジトリ内 `scripts/` に分離。

### 7.1 ステップ

1. **シードリスト生成**：可食フルーツの和名/英名/学名リストを用意。既存リストがなければ LLM に数百種を列挙させる（学名付きが望ましい）。重複・非可食を除外。
2. **分類解決（幹）**：各学名を GBIF `/species/match` にかけ、**usageKey と界〜属の完全な上位分類＋各ランクの key を一括取得**（§7.2）。表記ゆれ・シノニムはここで吸収。`matchType`/`confidence` を必ずログし、FUZZY/NONE は人手確認に回す。
3. **表示メタ付与（枝葉）**：Wikidata から日本語名・別名・画像・Wikipedia サイトリンクを、MediaWiki Action API から説明文抜粋＋サムネを取得（§7.2）。
4. **ツリー構築 + ルート決定 + プルーニング**：採用種の上位分類から内部ノードを一意化して木を組み、`lineage`/`childrenIds`/`ancestors`/`speciesCountUnder`/`representativeSpeciesIds` を埋める。全採用種の **LCA をルート**に設定し、いずれの採用種の祖先でもないノードは除外（§5.4）。
5. **静的 JSON 出力**：`taxa.json`（またはランク別分割）として書き出し、アプリにバンドル。

### 7.2 データソース（検証済みの構成）

| 用途 | 採用ソース | 形式 | 備考 |
|---|---|---|---|
| 分類階層の幹 | **GBIF** `/species/match` | REST/JSON, キー不要 | `api.gbif.org/v1/species/match?name=…` が usageKey＋kingdom〜genus の名称と各 key を**一括返却**。幹はこれだけで組める。`/parents` は階層欠落時のフォールバックのみ。`/children` は不要（ツリーは採用集合から組む） |
| 日本語名・別名・画像・WPリンク | **Wikidata** SPARQL | `query.wikidata.org/sparql` | 親=P171, ランク=P105, 画像=P18, 別名=P1843, 各言語ラベル, Wikipediaサイトリンク |
| 説明文抜粋＋サムネ | **MediaWiki Action API** | `{lang}.wikipedia.org/w/api.php` | `action=query&prop=extracts\|pageimages&exintro&explaintext&piprop=thumbnail&titles=…`。**旧 RESTBase 系（`/api/rest_v1/page/summary`）は非推奨化・リダイレクト方向のため不採用**。後継 Core REST API も 2026/07 から段階的非推奨で後継ルート未定 |
| 種リスト | LLM 列挙（学名付き） | — | GBIF マッチで裏取りして正規化 |

**運用上の必須事項**：未認証・自動アクセス向けレート制限が 2026 年に導入されつつあるため、**連絡先（メール or URL）を含む meaningful な User-Agent ヘッダ**を全リクエストに付与する。バッチは低頻度＋キャッシュ前提なので通常は制限内。

### 7.3 検証タスク（実装初手で必ず実施）

シードの一部（例：50種）で PoC を回し、各ソースの**カバレッジ**（学名マッチ率、和名・画像・説明の取得率）と**整合性**（分類のブレ）を比較し、最終構成を確定する。Wikidata の分類は複数親が許容される点に注意し、**幹は GBIF を正とする**方針を基本線とする。

### 7.4 フルーツの追加フロー — **モデルA を先に実装、B は将来拡張（確定）**

設計の核：**分類ツリーはシードリストの純粋な関数**。追加 = 採用集合に1種足して再構築するだけ。新しい科・目が必要なら GBIF の系統情報から内部ノードが自動で生え、ルート（LCA）も自動再計算される。フェッチ結果は **GBIF usageKey をキーにキャッシュ**するので、再構築時は新規分のみ取得（冪等・低コスト）。

- **モデルA / ビルド時追補（M1〜M4 で採用）**：シードファイルに追記 → `build:taxa` 再実行 → 再デプロイ。シンプル・堅牢・完全にバージョン管理可能。追加のたびに再デプロイが要る（旅先で即時には増やせない）。
- **モデルB / アプリ内追補（M5 以降の拡張）**：アプリ内で名前入力 → サーバレス関数が GBIF/Wikidata で解決しプレビュー → 確定で `supplemental_taxa`（同期 DB）に保存 → 起動時に静的 JSON とマージして再ルート/プルーニング。再デプロイ不要で旅先で完結。溜まった追補は定期的に基底シードへ「昇格」させ再ビルドする。

**Bを後付けするための継ぎ目（seam）**：再構築コアを純関数 `buildTaxonTree(resolvedSpecies)` として実装し、`resolvedSpecies` の供給元だけを差し替え可能にしておく。モデルB は「`resolvedSpecies` に実行時マージ分を足す」だけで、ルート決定・プルーニング・関係リスト生成は一切変更不要。

---

## 8. 技術スタック

- **フロントエンド**：React + Vite、モバイル最適化、PWA 対応（ホーム追加・オフライン閲覧）。
- **静的分類データ**：ビルド時生成の JSON をバンドル or 静的配信。
- **認証＋同期 DB**：Supabase（Auth＋Postgres）。認証は **Google OAuth のみ**有効化。保存対象は `fruit_log`（＋モデルB採用時は `supplemental_taxa`）。代替：Firebase。
- **データパイプライン**：Node または Python のスクリプト（`scripts/` に分離、CI または手動実行）。

---

## 9. 画面構成（モバイル）

1. **ツリー（ホーム）**：ドリルダウン＋パンくず＋各ノードの制覇バッジ＋**果物プレビュー**＋**未踏フィルタ**。
2. **フルーツ詳細**：画像・名前・パンくず・関係リスト・記録編集・WP リンク。
3. **検索**：和名/英名/学名。
4. **マイページ**：ログイン、食べた一覧、統計（食べた科数/目数など）。

> 旧「未踏マップ」画面は廃止し、ツリーの未踏フィルタ（§4.1）に統合した。全体俯瞰ビュー（treemap/sunburst）が必要になれば §5.5 の集計の上に別画面として後付け可能。

---

## 10. 非機能要件

- ナビゲーションは外部 fetch なしで即応（データはローカル/バンドル）。
- モバイル縦画面前提のレイアウト。
- ユーザー記録はログイン単位で隔離（RLS、§6.2）。
- 分類データ更新はパイプライン再実行＋再デプロイで反映（リアルタイム更新不要）。

---

## 11. 状態・エラー設計

| 状態 | 挙動 |
|---|---|
| 未ログイン | 閲覧は全可。記録系 UI（食べたトグル・評価・メモ・場所）は無効化し「Google でログイン」を促す |
| ローディング | 分類データはバンドル済みで基本不要。`fruit_log` 取得中のみバッジを skeleton 表示 |
| 検索 0 件 | 「該当なし」＋別表記（学名/英名）での再検索を提案 |
| オフライン（閲覧） | ツリー・詳細・検索は完全動作（ローカルデータ） |
| オフライン（記録） | 書き込みをローカルキューに退避し、再接続時に冪等アップサートで同期。UI に「同期待ち」表示 |
| 同期競合 | `updated_at` のラストライトウィン |
| GBIF/Wikidata 解決失敗（モデルB時） | プレビュー画面でエラー表示＋再試行。NONE マッチは手動入力にフォールバック |

---

## 12. 分類エッジケース

- **複数親（Wikidata P171 が複数）**：幹は GBIF を正とするため**単一親**。Wikidata は表示メタ専用とし、親の競合は無視。
- **ランク欠落（GBIF が genus 等を返さない）**：`ancestors` の当該キーを省略。近さ判定はランクキー比較なので欠落を自然にスキップし、利用可能な最下位ランクで判定（§5.1）。
- **単型・中間ランク欠落でパス長が不揃い**：必ず**ランクで比較**（位置比較禁止）。
- **品種・栽培品種（cultivar）**：原則 SPECIES ノードに集約。将来 cultivar を種以下ノードとして追加する場合のみ「同種＝品種違い」が発火（§5.2）。
- **雑種（× 表記）**：GBIF match 可否を PoC で確認。マッチ不可なら親種にマップ、または手動採用。
- **和名の同名異物**：真の ID は GBIF usageKey。和名は表示専用で ID にしない。
- **科の再編（APG 等）**：GBIF backbone に準拠して固定し、再ビルドで追従。

---

## 13. 段階的実装計画

1. **M1 データ基盤**：シード50種でパイプライン PoC → ソース確定 → 全種で `taxa.json` 生成。
2. **M2 閲覧**：ツリーナビ（制覇バッジ＋果物プレビュー＋未踏フィルタ）＋フルーツ詳細＋関係リスト（記録なし、ローカルのみ）。
3. **M3 記録**：Google 認証＋クラウド同期で tried/評価/メモ/場所。
4. **M4 発見**：未踏フィルタの磨き込み、統計、検索強化。
5. **M5（拡張）**：モデルB（アプリ内追補）、必要なら全体俯瞰ビュー。

---

## 14. 受け入れ基準・テストケース

データセットに 黄金果(*Pouteria caimito*)・柿(*Diospyros kaki*)・ライチ(*Litchi chinensis*) を含めた状態で：

**近さ判定（§5.2）**
- `sharedLowestRank(黄金果, 柿)` → `ORDER`（ともに Ericales）／ラベル「中くらい（隣の枝・同目）」
- `sharedLowestRank(黄金果, ライチ)` → `FAR`（Ericales vs Sapindales）

**関係リスト（§5.3）— 黄金果の詳細**
- 「同じ科の別の属」に他の Sapotaceae が属見出しで並ぶ
- 「同じ目の別の科」に **Ebenaceae 見出し → 柿** が出現（「柿はここ」）
- ライチはいずれのセクションにも現れない
- 一度も食べていない近縁グループに `untrodden=true` が立つ

**ルート/プルーニング（§5.4）**
- 採用集合が {黄金果, 柿, ライチ} のとき、ルート（LCA）は全共通祖先に設定され、採用種の祖先でない科・目は含まれない
- 黄金果の祖先外の種を追加するとルートが上方に移動する（純関数性）

**ツリー表示（§4.1 / §5.5 / §5.6）**
- 各ノード行に制覇バッジ（例：アカテツ科 2/3）が出る
- 果物プレビューに、食べた種が先頭・強調で表示される（例：カキノキ科の行に「柿」がアンカーとして出る）
- **未踏フィルタ ON** で、食べた数 0 の子ノードだけが残り、上部に「未踏 N / 総 M」が出る

**記録・隔離（§6.2）**
- 別ユーザーの `fruit_log` 行が RLS で読めない／書けない
- 同一 `(user_id, taxon_id)` の再記録がアップサートで一意に保たれる

---

## 15. 決定ログ（確定事項）

- 未ログイン時は閲覧のみ。記録はログイン必須。
- ルートは収録フルーツの最小共通祖先（LCA）。フォーカス外の科・目は持たない。
- 可食の線引きはシード収録時に人間が判断。設計コアに含めない。
- 認証は Sign in with Google のみ（メアド認証なし）。
- UI は日本語前提。
- 近さ判定は `ancestors`（ランク→ID）によるランクキー比較（位置比較禁止）。
- 説明文ソースは MediaWiki Action API（旧 RESTBase 不採用）。幹は GBIF `/species/match` で完結。
- 追加フローはモデルA先行・B将来（純関数 `buildTaxonTree` を seam に）。
- **未踏マップは独立画面を廃止し、ツリーの未踏フィルタに統合**。
- 各ノードに**果物プレビュー**（食べた種を優先表示）を追加。