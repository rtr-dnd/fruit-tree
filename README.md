# フルーツ系統樹トラッカー 🌳🍈

旅先で食べた珍しいフルーツを、**植物の分類階層（目→科→属→種）の木**としてたどりながら記録するモバイル Web アプリ（PWA）。仕様は [`docs.md`](./docs.md)。

- 「柿とどれくらい近い？」「隣の枝に何がある？」「未踏の枝はどこ？」に、Wikipedia を行き来せず答える。
- 近さ＝**共有する最下位の分類ランクの深さ**（同属＞同科＞同目）。
- ナビゲーションは**外部 fetch なし**（分類データはビルド時にバンドル）。

## クイックスタート

```bash
npm install
npm run dev          # 開発サーバ
npm test             # ユニット＋UI テスト（47件）
npm run build        # 本番ビルド（PWA 生成）
```

分類データ `src/data/taxa.json` は同梱済み。再生成する場合のみ：

```bash
npm run resolve:taxa   # GBIF/Wikidata/MediaWiki から解決（要ネットワーク・キャッシュあり）
npm run build:taxa     # ResolvedSpecies → taxa.json（純関数 buildTaxonTree、オフライン）
```

## アーキテクチャ

```
src/
  core/            アルゴリズムの心臓部（§5）。React 非依存・純関数・テスト網羅
    closeness.ts     sharedLowestRank / closenessLabel（§5.2）
    tree.ts          buildTaxonTree = LCA + プルーニング（§5.4）。シードの純関数
    relationships.ts buildRelationshipList（§5.3）
    coverage.ts      制覇率・未踏判定（§5.5）
    preview.ts       代表種プレビュー選定（§5.6）
    search.ts        正規化 + 前方一致 + Fuse あいまい一致（§5.7）
    __tests__/       受け入れ基準（§14）の単体テスト
  data/            taxa.json（静的バンドル）＋ロード・検索インデックス
  state/           auth（Google OAuth）/ log（記録ストア。localStorage + Supabase 同期）
  components/      Breadcrumb / CoverageBadge / Preview / RelationshipList / RecordEditor …
  screens/         TreeScreen / DetailScreen / SearchScreen / MyPageScreen（§9）
scripts/           データパイプライン（§7）。GBIF=幹、Wikidata=和名/画像、MediaWiki=説明
supabase/migrations/  fruit_log（§6.2 RLS）＋ supplemental_taxa（将来 §6.3）
```

### データの流れ
1. `scripts/seed.ts`（可食フルーツの学名リスト）
2. **GBIF** `/species/match` で usageKey ＋ 界〜属を一括解決（幹）
3. **Wikidata** `P846`(GBIF taxon ID) で和名・画像・WP サイトリンク（表記ゆれに強い）
4. **MediaWiki** Action API で説明文抜粋（ja 優先 / en フォールバック）
5. `buildTaxonTree` で LCA をルートにプルーニング → `taxa.json`

> パイプラインは GBIF/Wikidata/MediaWiki に**連絡先入り User-Agent**を付与し、レスポンスを `scripts/.cache/` にキャッシュします（§7.2）。

## 認証・同期（Supabase）

`.env`（`.env.example` 参照）に設定すると Google ログイン＋クラウド同期が有効になります。

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

- 認証は **Sign in with Google のみ**（§4.5）。Supabase ダッシュボードで Google プロバイダを有効化。
- `supabase/migrations/*.sql` を適用（`fruit_log` ＋ RLS）。
- **未設定でも動作**：記録は端末内（localStorage）に保存される「ローカル保存モード」になります。
- オフライン記録はローカルキューに退避し、再接続時に冪等アップサートで同期（§11）。

## 受け入れ基準（§14）との対応

`src/core/__tests__/` と `src/data/taxa.integration.test.ts` が §14 を検証：
- `sharedLowestRank(黄金果, 柿)=ORDER`、`(黄金果, ライチ)=FAR`
- 黄金果の関係リストに「同じ科の別の属」「同じ目の別の科 → カキノキ科 → 柿」、ライチは非表示
- LCA ルート決定／プルーニング、祖先外の種追加でルートが上昇（純関数性）
- 制覇バッジ、未踏フィルタ、食べた種優先プレビュー

`src/ui.test.tsx` が各画面の描画スモークを担保。

## デプロイ

静的ホスティング（Vercel/Netlify/Cloudflare Pages 等）に `dist/` を配置。SPA なので
**全パスを `index.html` にフォールバック**する設定を入れてください（`/n/:id` 等の深いリンク用）。

## 段階的実装状況（§13）

- [x] M1 データ基盤：パイプライン＋ `taxa.json`（41 種）
- [x] M2 閲覧：ツリーナビ・詳細・関係リスト
- [x] M3 記録：Google 認証＋同期（＋ローカルフォールバック）
- [x] M4 発見：未踏フィルタ・統計・検索
- [ ] M5 拡張：モデルB（アプリ内追補）、全体俯瞰ビュー — `buildTaxonTree` を seam として用意済み
