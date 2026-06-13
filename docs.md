# フルーツ系統樹トラッカー — 仕様 / アーキテクチャ

植物の分類階層（目 → 科 → 属 → 種）を木としてたどりながら、食べたフルーツを記録するモバイル Web アプリ（PWA）。UI 言語は日本語。

このドキュメントは「いま実装されている状態」を説明するものです。

---

## 1. 何ができるか

- **分類ツリーをドリルダウン**して、フルーツが分類上どこに属するかを見る。
- フルーツの詳細で、**近縁の仲間**（同じ属／同じ科の別属／同じ目の別科）をワンタップでたどる。
- 各フルーツに「**生で食べた／加工品を食べた／食べてない**」を記録（評価・メモ・場所・日付も）。
- **制覇バッジ**で、分類グループごとに何種食べたかを把握する。
- 和名・英名・学名で**検索**。
- リストに無いフルーツを、名前で検索して**カタログに追加**（全ユーザー共有）。
- Google ログインで記録を**複数端末同期**。未ログインでも閲覧は可能。

### 画面（下タブ）

| タブ | 内容 |
|---|---|
| **ツリー** | 分類階層を1階層ずつドリルダウン。パンくず・制覇バッジ・代表フルーツのプレビュー。種の行はサムネ＋チェック。 |
| **リスト** | 全フルーツを「最近追加された順」で一覧。各行のチェックで食べた状態をその場で記録。 |
| **追加** | 名前を検索 → 分類を自動解決 → プレビュー → カタログに追加。 |
| **検索** | 和名/英名/学名で横断検索。ヒットしなければそのまま「追加」へ誘導。 |
| **マイページ** | ログイン、統計（食べた種数/科数/目数）、食べた一覧。 |

ナビゲーションの起点（ホーム）は、収録フルーツ全体の**最小共通祖先（LCA）**ノード。

---

## 2. 「近さ」の定義（中核概念）

2つのフルーツの近さは、**共有する最下位の分類ランクの深さ**で決まる。

| 共有する最下位ランク | 近さラベル |
|---|---|
| 同じ属 (GENUS) | 近い（同属） |
| 同じ科 (FAMILY) | やや近い（同科） |
| 同じ目 (ORDER) | 中くらい（隣の枝・同目） |
| 目より上（綱/門以上）でしか一致しない | 遠い（FAR、関係リストには出さない） |

- ランクは配列の位置ではなく、各ノードが持つ `ancestors`（ランク名 → 祖先ID のマップ）を**ランク名で**突き合わせて判定する（ランク欠落・単型中間ランクに強い）。
- 例：黄金果（アカテツ科）と柿（カキノキ科）は **同じツツジ目** → 「隣の枝」。ライチ（ムクロジ目）とは目が異なる → 遠い（関係リストに出ない）。

### 関係リスト（フルーツ詳細）

近い順にバケット化し、見出しでグループ化して表示する。
- **同じ属の仲間**
- **同じ科の別の属**（属で見出し）
- **同じ目の別の科**（科で見出し ＝ 隣の枝）

各項目に近さラベルと「食べたか」を表示。一度も食べていない近縁グループには「未踏」フラグが立つ。並びは「未踏が上 → 和名昇順」。

---

## 3. 技術スタック

- **フロントエンド**：Next.js 15（App Router）＋ React 19 ＋ TypeScript。モバイル最適化・PWA（`app/manifest.ts`）。
- **UI**：Tailwind v4 ＋ shadcn/ui（`components/ui/`）。テーマは緑系（`app/globals.css`）。
- **認証・データベース**：Supabase（Auth ＋ Postgres、RLS）。認証は Google OAuth のみ。
- **検索**：fuse.js（クライアント実行）。
- **データ取得元**（フルーツ解決）：GBIF（分類）／Wikidata（和名・画像）／MediaWiki（説明文）。

アプリ本体は実質クライアントレンダリング。`/n/[id]` のみリクエスト時にサーバレンダリング、他は静的。

---

## 4. データモデル

### 4.1 分類カタログ（Supabase `taxa`）

フルーツの種＝カタログ1件。**すべてのフルーツが Supabase で一元管理される**（特別扱いの「初期データ」概念は無い）。

```sql
create table public.taxa (
  id          text        primary key,   -- 種の安定slug（例: durio-zibethinus）
  resolved    jsonb       not null,       -- 解決済み ResolvedSpecies（分類・名前・画像など）
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
```

RLS：
- **閲覧**：誰でも（未ログイン含む）
- **追加**：ログイン済みなら誰でも（`created_by = auth.uid()`）
- **削除・更新**：管理者のみ（`is_admin()`）

管理者は `admins` テーブル（`user_id` PK）で管理。`is_admin()` は SECURITY DEFINER 関数。

`resolved` に入る **ResolvedSpecies**（`lib/core/types.ts`）：
```ts
interface ResolvedSpecies {
  id: string                  // 種の安定slug
  scientificName: string
  names: { ja?: string|null; en?: string|null }
  imageUrl?: string|null
  wikipediaUrl?: string|null
  description?: string|null
  searchAliases?: string[]    // 検索の別名（表記ゆれ対策）
  classification: ResolvedRank[] // KINGDOM..GENUS（root→parent の順）
}
interface ResolvedRank { rank, id, scientificName, names?, imageUrl?, ... }
```

### 4.2 オフライン用スナップショット（同梱）

`lib/data/snapshot.json` に全カタログのコピー（`CatalogEntry[] = { id, resolved, createdAt }`）をバンドルする。
- 起動直後に**即時描画**し、オフラインでも閲覧できるためのベースライン。
- 起動後に Supabase から最新を取得して置き換え、`localStorage` にもキャッシュする。
- `npm run build:snapshot` で再生成（§7）。手キュレーションではなく DB/パイプライン出力の写し。

### 4.3 ユーザー記録（Supabase `fruit_log`）

```sql
create table public.fruit_log (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  taxon_id    text    not null,                 -- taxa.id（種slug）
  tried       boolean not null default true,
  form        text    check (form in ('raw','processed')), -- 生 / 加工品（null=区別なし）
  rating      smallint check (rating between 1 and 5),
  notes       text,
  place       text,
  tried_date  date,
  updated_at  timestamptz not null default now(),
  primary key (user_id, taxon_id)
);
```

- RLS：自分の行のみ読み書き可。
- 「食べた」は **3状態**：生で食べた（`tried=true, form='raw'`）／加工品を食べた（`tried=true, form='processed'`）／食べてない（行なし or `tried=false`）。`form` が null の記録は「生」とみなして表示・集計する。

### 4.4 TaxonNode（実行時の分類ツリー）

`buildTaxonTree`（§5）が `ResolvedSpecies[]` から組み立てるノード（`lib/core/types.ts`）：
```ts
interface TaxonNode {
  id, rank, scientificName, names, parentId, childrenIds,
  lineage: string[],                  // root→parent の祖先ID（パンくず用）
  ancestors: Partial<Record<Rank,string>>, // ランク→祖先ID（近さ判定用）
  isEdibleFruit, imageUrl, wikipediaUrl, description,
  speciesCountUnder, representativeSpeciesIds, // 内部ノード用
  searchAliases?, addedAt?, addedSeq?,         // SPECIES 用（addedSeq=追加順）
}
```

---

## 5. 分類ツリーの構築（アルゴリズム）

中核ロジックは `lib/core/`（React 非依存の純関数、テストあり）。

- **`buildTaxonTree(resolvedSpecies)`**：採用種の集合から
  - 全種の root→leaf パスの**最長共通接頭辞の末尾＝LCA をルート**にする、
  - LCA〜葉のノードだけ残す（プルーニング）、
  - `lineage` / `childrenIds` / `ancestors` / `speciesCountUnder` / `representativeSpeciesIds` を埋める。
  - 純関数なので、種を足すと LCA が自動で上に移動し、新しい科・目の内部ノードが自動で生える。
- **`sharedLowestRank(a,b)` / `closenessLabel`**：近さ判定（§2）。
- **`buildRelationshipList(focusId, tree, log)`**：関係リスト生成（§2）。
- **`coverage(tree, node, log)`**：制覇集計。`raw`（生で食べた数）・`processed`（加工品のみ）・`any`（どちらか）・`total` を返す。比率は生のみ（raw/total）。
- **`representativePreview`**：各ノードの代表サムネ選定（食べた種を優先）。
- **`search` / `buildSearchIndex` / `normalize`**：正規化（NFKC＋小文字＋カナ→かな）＋前方一致＋ fuse.js あいまい一致。`searchAliases` も対象。

### 実行時の組み立て（`lib/data/catalog.ts`）

- **`buildCatalogTree(entries)`** = `buildTaxonTree(entries.map(resolved))` ＋ `createdAt` 昇順で `addedAt`/`addedSeq` を付与。
- カタログの供給元（`state/catalog.tsx`）：起動時はキャッシュ or 同梱スナップショット → Supabase 取得で更新。`state/tree.tsx`（`useTree`）がこれをツリー化して全画面に供給する。
- フルーツを追加/削除すると、同じ純関数でツリーを再構築するだけで、ルート・関係リスト・検索が自動で追従する。

---

## 6. 認証・権限・同期

- **認証**：Supabase の Google OAuth のみ（`state/auth.tsx`）。未ログインは閲覧専用。記録・追加はログイン必須。
- **権限**：
  - 閲覧：誰でも
  - 記録（`fruit_log`）：本人のみ
  - カタログ追加（`taxa`）：ログイン済みなら誰でも
  - カタログ削除：管理者のみ（不適切な項目の除去）
- **同期**（`state/log.tsx`）：記録は `localStorage` に即保存しつつ Supabase にアップサート。オフライン時はローカルキューに退避し、再接続・再ログイン時に冪等同期（競合はラストライトウィン）。
- **未設定フォールバック**：`NEXT_PUBLIC_SUPABASE_*` が未設定なら「ローカル保存モード」（記録・追加とも端末内に保存、管理者扱い）。開発・オフライン検証用。

---

## 7. データパイプライン（フルーツの分類解決）

名前から分類・和名・画像・説明を解決して `ResolvedSpecies` を作る。**2系統**ある。

### 7.1 アプリ内（実行時 / `lib/resolve-client.ts`）

「追加」画面と検索の「追加」導線から呼ばれる。ブラウザから直接：
1. **GBIF** `/species/match` で学名→usageKey＋界〜属を解決（学名でなければ Wikidata ラベル検索で学名に変換してから）。
2. **Wikidata**（P846＝GBIF taxon ID）で和名・英名・画像・Wikipedia サイトリンク。
3. **MediaWiki** Action API で説明文抜粋（ja 優先 / en フォールバック）。
GBIF/Wikidata/MediaWiki はいずれも CORS 許可済みでバックエンド不要。

### 7.2 オフライン・一括（ビルド時 / `scripts/`）

スナップショット（同梱データ）と DB 初期投入 SQL を生成するための系統。
- `scripts/seed.ts` … 学名のリスト（一括解決の入力）。
- `npm run resolve:taxa`（`scripts/resolve.ts`）… 上記3ソースで一括解決し `scripts/.cache/resolved.json` に保存（レスポンスはキャッシュ）。連絡先入りの User-Agent を付与。
- `npm run build:snapshot`（`scripts/build-snapshot.ts`）… `resolved.json` から
  - `lib/data/snapshot.json`（同梱スナップショット）
  - `scripts/out/seed-taxa.sql`（Supabase `taxa` への初回一括投入）
  - `lib/data/added-dates.json`（追加順の台帳。新規種に連番・日付を付与し `created_at` の元にする）
  を生成。

---

## 8. ディレクトリ構成

```
app/                  App Router
  layout.tsx            Providers ＋ 下タブ ＋ メタデータ
  page.tsx              ホーム（ツリーのルート）
  n/[id]/page.tsx       ノード詳細/ドリルダウン
  add/ search/ me/      追加・検索・マイページ
  manifest.ts globals.css
components/
  ui/                   shadcn プリミティブ
  NodeView TreeView DetailView SearchView CheckListView MyPageView AddFruitView
  Breadcrumb CoverageBadge Preview RelationshipList RecordEditor SpeciesRow SyncBanner FruitImage BottomNav Providers
lib/
  core/                 分類アルゴリズム（純関数＋テスト）
  data/                 catalog.ts（ツリー組み立て）/ snapshot.json（同梱）/ added-dates.json
  resolve-client.ts     アプリ内フルーツ解決
  supabase.ts utils.ts labels.ts
state/                  auth / catalog / tree / log（React Context）
scripts/                resolve.ts（解決）/ build-snapshot.ts（同梱生成）/ seed.ts / pipeline /
supabase/migrations/    0001 fruit_log / 0002 taxa＋admins / 0003 fruit_log.form
```

---

## 9. 制覇バッジの表示（配色）

- 生で食べた数＝**緑**、加工品でも食べた分＝**黄**。
- 基本は緑で「生 N/総」。加工品でも食べた種があれば余白に応じて黄で補足（広い場所は「計 M/総」、行内は「+k」）。
- 生をまだ食べていない（加工品のみ）→ 黄一色。どちらも無し → 「未踏」。
- リスト/ツリーの種行のチェックは「食べてない → 生（緑✓）→ 加工品（黄📦）」を循環。

---

## 10. セットアップ

### 10.1 依存と起動

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # ユニット＋UIテスト
npm run build      # 本番ビルド
```

### 10.2 Supabase（同期・共有を使う場合）

未設定でもローカル保存で動作する。クラウド同期・共有カタログ・Google ログインを使うには：

1. `.env.local` を作成（`.env.example` 参照）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # 旧 anon key も可（NEXT_PUBLIC_SUPABASE_ANON_KEY）
   ```
2. SQL Editor で `supabase/migrations/0001_fruit_log.sql`・`0002_taxa.sql`・`0003_fruit_log_form.sql` を実行。
3. カタログ初期投入：`npm run build:snapshot` で生成される `scripts/out/seed-taxa.sql` を SQL Editor で実行。
4. 自分を管理者に：
   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = '<あなたのメール>' on conflict do nothing;
   ```
5. Authentication → Providers で Google を有効化。Google 側の OAuth クライアントのリダイレクト URI は
   `https://<project>.supabase.co/auth/v1/callback`。Authentication → URL Configuration の Redirect URLs に
   `http://localhost:3000`（と本番URL）を追加。

### 10.3 デプロイ

Vercel（Next.js ネイティブ）に接続し、環境変数 `NEXT_PUBLIC_SUPABASE_*` を設定。本番 URL を Supabase の Redirect URLs に追加。

---

## 11. 受け入れ基準（テスト）

`lib/core/__tests__/` と `lib/data/catalog.test.ts`、`components/ui-smoke.test.tsx` が以下を検証する：
- 近さ：`sharedLowestRank(黄金果, 柿)=ORDER`、`(黄金果, ライチ)=FAR`
- 関係リスト：黄金果に「同じ科の別の属」「同じ目の別の科 → カキノキ科 → 柿」、ライチは非表示
- ルート決定（LCA）・プルーニング・純関数性（種追加でルートが上昇）
- 制覇集計（生/加工の分離）、検索（別名「らいち」でヒット）
- 各画面の描画と、カタログ追加でツリーに出現すること
