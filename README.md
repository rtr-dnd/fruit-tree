# フルーツ系統樹トラッカー 🌳🍈

旅先で食べた珍しいフルーツを、**植物の分類階層（目→科→属→種）の木**としてたどりながら記録するモバイル Web アプリ（PWA）。仕様は [`docs.md`](./docs.md)。

- 「柿とどれくらい近い？」「隣の枝に何がある？」「未踏の枝はどこ？」に、Wikipedia を行き来せず答える。
- 近さ＝**共有する最下位の分類ランクの深さ**（同属＞同科＞同目）。
- ナビゲーションは**外部 fetch なし**（分類データはビルド時にバンドル）。

## 技術スタック

- **Next.js 15（App Router）+ React 19 + TypeScript**
- **Tailwind v4 + shadcn/ui**（new-york / `components/ui/`）
- **Supabase**（Google OAuth ＋ Postgres、未設定時は localStorage フォールバック）
- データパイプライン：Node スクリプト（GBIF / Wikidata / MediaWiki）

## クイックスタート

```bash
npm install
npm run dev          # 開発サーバ (http://localhost:3000)
npm test             # ユニット＋UI テスト（47件）
npm run build        # 本番ビルド（全ノードを静的生成）
npm start            # ビルド成果物を配信
```

分類データ `lib/data/taxa.json` は同梱済み。再生成する場合のみ：

```bash
npm run resolve:taxa   # GBIF/Wikidata/MediaWiki から解決（要ネットワーク・キャッシュあり）
npm run build:taxa     # ResolvedSpecies → taxa.json（純関数 buildTaxonTree、オフライン）
```

## アーキテクチャ

```
app/                 App Router
  layout.tsx           Providers（Auth/Log）＋ BottomNav ＋ メタデータ/viewport
  page.tsx             ホーム＝ツリーのルート
  n/[id]/page.tsx      ノード（種→詳細 / 内部→ツリー）。generateStaticParams で全ノード静的化
  search/page.tsx      検索
  me/page.tsx          マイページ
  manifest.ts          PWA マニフェスト
  globals.css          Tailwind v4 ＋ shadcn テーマトークン（緑系）
components/
  ui/                  shadcn プリミティブ（button/card/input/textarea/label/badge/switch/skeleton）
  NodeView/TreeView/DetailView/SearchView/MyPageView   画面
  Breadcrumb/CoverageBadge/Preview/RelationshipList/RecordEditor/SyncBanner/FruitImage/BottomNav
lib/
  core/                アルゴリズムの心臓部（§5）。フレームワーク非依存・純関数・テスト網羅
    closeness.ts         sharedLowestRank / closenessLabel（§5.2）
    tree.ts              buildTaxonTree = LCA + プルーニング（§5.4）
    relationships.ts     buildRelationshipList（§5.3）
    coverage.ts / preview.ts / search.ts
    __tests__/           受け入れ基準（§14）の単体テスト
  data/                taxa.json（静的バンドル）＋ロード・検索インデックス
  labels.ts / utils.ts(cn) / supabase.ts
state/                 auth.tsx（Google OAuth）/ log.tsx（記録ストア・SSRセーフ・オフライン同期）
scripts/               データパイプライン（§7）。GBIF=幹、Wikidata=和名/画像、MediaWiki=説明
supabase/migrations/   fruit_log（§6.2 RLS）＋ supplemental_taxa（将来 §6.3）
```

### データの流れ（パイプライン §7）
1. `scripts/seed.ts`（可食フルーツの学名リスト）
2. **GBIF** `/species/match` で usageKey ＋ 界〜属を一括解決（幹）
3. **Wikidata** `P846`(GBIF taxon ID) で和名・画像・WP サイトリンク（表記ゆれに強い）
4. **MediaWiki** Action API で説明文抜粋（ja 優先 / en フォールバック）
5. `buildTaxonTree` で LCA をルートにプルーニング → `taxa.json`

> パイプラインは連絡先入り User-Agent を付与し、レスポンスを `scripts/.cache/` にキャッシュします（§7.2）。

## 認証・同期（Supabase）

`.env.local`（`.env.example` 参照）に設定すると Google ログイン＋クラウド同期が有効に：

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

- 認証は **Sign in with Google のみ**（§4.5）。Supabase で Google プロバイダを有効化。
- `supabase/migrations/*.sql` を適用（`fruit_log` ＋ RLS）。
- **未設定でも動作**：記録は端末内（localStorage）に保存される「ローカル保存モード」。
- オフライン記録はローカルキューに退避し、再接続時に冪等アップサートで同期（§11）。

詳しい手順は会話履歴の「Supabase 設定手順」を参照（Project URL/anon key → SQL マイグレーション → Google プロバイダ → リダイレクトURL）。

## 受け入れ基準（§14）との対応

`lib/core/__tests__/` と `lib/data/taxa.integration.test.ts` が §14 を検証：
- `sharedLowestRank(黄金果, 柿)=ORDER`、`(黄金果, ライチ)=FAR`
- 黄金果の関係リストに「同じ科の別の属」「同じ目の別の科 → カキノキ科 → 柿」、ライチは非表示
- LCA ルート決定／プルーニング、祖先外の種追加でルートが上昇（純関数性）
- 制覇バッジ、未踏フィルタ、食べた種優先プレビュー

`components/ui-smoke.test.tsx` が各画面の描画スモークを担保。

## デプロイ

- **Vercel**：リポジトリを接続するだけ（Next.js をネイティブサポート）。環境変数に `NEXT_PUBLIC_SUPABASE_*` を設定。
- 全ページが `generateStaticParams` で静的生成されるため、`output: 'export'` を加えれば任意の静的ホストにも出せます（その場合 SPA フォールバックは不要、各ノードが個別 HTML）。

## 段階的実装状況（§13）

- [x] M1 データ基盤：パイプライン＋ `taxa.json`（41 種・113 ノード）
- [x] M2 閲覧：ツリーナビ・詳細・関係リスト
- [x] M3 記録：Google 認証＋同期（＋ローカルフォールバック）
- [x] M4 発見：未踏フィルタ・統計・検索
- [ ] M5 拡張：モデルB（アプリ内追補）、全体俯瞰ビュー — `buildTaxonTree` を seam として用意済み
```
