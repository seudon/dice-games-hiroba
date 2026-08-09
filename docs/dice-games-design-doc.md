# サイコロゲーム広場 - 設計書

本書はプロジェクトの設計方針と現在の構造を記録するものです。
実装時に守るべき具体的なルールと手順は [`CLAUDE.md`](../CLAUDE.md) を参照してください。

## プロジェクト概要

### 目的
子供から高齢者まで楽しめるサイコロゲーム集のWebサイトを構築する。実際のサイコロで遊ぶことを推奨しつつ、ルール説明、記録表、ブラウザゲームの3要素を提供する。

### 技術スタック
- **フレームワーク**: Astro 5.x
- **UIコンポーネント**: Vue 3 (Composition API)
- **スタイリング**: Bootstrap 5.3 (CDN)
- **TypeScript**: strict mode
- **ホスティング**: GitHub Pages

### 設計方針
1. **段階的実装**: 1ゲームを完成させてからパターン化
2. **Vue統一**: フレームワーク混在を避け、Vueに統一
3. **アクセシビリティファースト**: 最初から対応を組み込む
4. **Bootstrap活用**: CDNで読み込み、カスタムCSSは最小限
5. **将来の拡張性**: サーバー連携を見据えた抽象レイヤー

---

## アーキテクチャ

### ゲーム1つの構成

1ゲームは「静的なルール説明」と「インタラクティブなゲーム本体」に分かれる。
前者をMarkdown、後者をVueコンポーネントが担い、Astroのページが両者を束ねる。

```
src/content/games/{slug}.md      frontmatter（メタ情報 + config）+ 本文（ルール説明）
        ↓ getCollection() / src/content/config.ts のzodスキーマで型付け
src/pages/games/[slug].astro     getStaticPaths()で全ゲームページを静的生成
        ↓ data.component の文字列で分岐し、config をpropsに展開
src/components/games/{Name}.vue  client:visible でハイドレート
```

ルール説明は静的HTMLとして配信され、JavaScriptを必要としない。
ゲーム本体だけがAstro Islandsとしてハイドレートされるため、
ゲームを追加してもトップページや一覧ページの転送量は増えない。

### ゲームページの構成

当初はルール説明を読ませることを主目的としたため、
「ヘッダー → ルール全文 → ゲーム本体」という縦一列の構成だった。
しかし実際にはブラウザゲームが主に使われるようになり、
ルールを丁寧に書くほどゲームが下に押しやられる状態になっていた
（実測でスマホ最大6.6画面ぶんのスクロールが必要）。

現在はゲーム本体を先に置き、詳細なルールは折りたたんでいる。

```
ヘッダー（タイトル・難易度・カテゴリー・説明・メタ情報）
クイックルール（frontmatterの quickRule / 2〜3文）
ゲーム本体                              ← 全ゲームが0.7画面以内
詳しいルールと戦略（<details>で折りたたみ）
```

折りたたみに `<details>` を使っているのは、JavaScript不要で
キーボード操作にも対応でき、中身がHTMLに存在するため検索エンジンにも読まれるため。

### コンポーネントの動的解決

ゲームは「どんどん追加していく」ことを前提とするため、
ページ側にゲームを1本ずつ登録する作業を残さない設計にしている。

当初は `[slug].astro` で `game.data.component` を文字列マッチし、
importと分岐を手で並べていた。ゲームが増えるほど編集箇所が増え、
登録を忘れるとページは生成されるのにゲーム欄だけが無言で空になる問題があった。

現在は `GameHost.vue` が `import.meta.glob` で
`src/components/games/` を走査し、component名から実際のゲームを解決する。
`.vue` を置いてmdに名前を書けば表示されるため、ページ側の編集は不要。

**なぜVue側で解決するのか**: Astroの `client:` ディレクティブは
静的にimportされたコンポーネントしか受け付けず、動的に解決したものを渡すと
`NoMatchingImport` エラーになる。そのためページ側は `GameHost` だけを
`client:only="vue"` でマウントし、選択の責任をVue側に移している。

動的importのため、実際に読み込まれるチャンクは選択された1つだけで、
ゲームが増えてもページの転送量は増えない。

component名が解決できない場合は `[slug].astro` がビルド時に例外を投げ、
利用可能なコンポーネント名を一覧表示する。

---

## プロジェクト構成

```
dice-games-hiroba/
├── src/
│   ├── content/
│   │   ├── config.ts                    # Content Collections型定義
│   │   └── games/                       # ゲーム情報(Markdown) 7件
│   │       ├── zorome-challenge.md
│   │       ├── fifty-game.md
│   │       ├── quick-math.md
│   │       ├── dice-adventure.md
│   │       ├── cho-han.md
│   │       ├── dice-poker.md
│   │       └── pig-game.md
│   │
│   ├── components/
│   │   ├── common/                      # 共通コンポーネント
│   │   │   ├── DiceDisplay.vue         # サイコロ単体表示
│   │   │   └── DiceTray.vue            # サイコロトレイ
│   │   ├── games/                       # ゲームコンポーネント 7件
│   │   │   ├── GameHost.vue            # component名からゲームを動的解決
│   │   │   ├── ZoromeGame.vue          # ぞろ目チャレンジ
│   │   │   ├── FiftyGame.vue           # 50ゲーム
│   │   │   ├── QuickMathGame.vue       # サイコロ早押し計算
│   │   │   ├── DiceAdventureGame.vue   # ダイスアドベンチャー
│   │   │   ├── ChoHanGame.vue          # 丁半博打
│   │   │   ├── DicePokerGame.vue       # サイコロポーカー
│   │   │   └── PigGame.vue             # ブタのしっぽ
│   │   └── ui/
│   │       └── GameCard.astro          # ゲームカード
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro            # サイト全体レイアウト
│   │   └── GameLayout.astro            # ゲームページレイアウト
│   │
│   ├── pages/
│   │   ├── index.astro                 # トップページ
│   │   ├── games/
│   │   │   ├── [slug].astro           # 動的ゲームページ
│   │   │   └── index.astro            # ゲーム一覧
│   │   └── about.astro                # サイトについて
│   │
│   ├── lib/
│   │   ├── storage/
│   │   │   └── LocalStorage.ts        # LocalStorage実装
│   │   └── utils/
│   │       └── dice.ts                 # サイコロユーティリティ
│   │
│   └── types/
│       └── game.ts                     # 共通型定義
│
├── docs/
│   ├── dice-games-design-doc.md        # 本書
│   └── git-workflow.md                 # Git運用ワークフロー
│
├── .github/workflows/deploy.yml        # GitHub Pages自動デプロイ
├── public/favicon.svg
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── CLAUDE.md                           # プロジェクト実装ガイド
├── LICENSE
└── README.md
```

---

## 実装済み機能

### 1. レイアウトシステム
- **BaseLayout.astro**: Bootstrap 5.3をCDNから読み込み、ナビゲーションとフッターを含む全ページ共通レイアウト
- **GameLayout.astro**: ゲームページ専用レイアウト

### 2. 共通コンポーネント
- **DiceDisplay.vue**: ドットベースのサイコロ表示（1の目は赤、2-6は黒）。サイズ3種、回転アニメーション、キープ表示、クリック操作に対応
- **DiceTray.vue**: カジノ風緑フェルトのサイコロトレイ。1〜15個のサイコロ数に応じてグリッドとサイズを自動調整
- **GameCard.astro**: ゲーム一覧用カード

### 3. 実装済みゲーム（7種）

| ゲーム | コンポーネント | 難易度 | サイコロ | 記録の保存先 |
| :--- | :--- | :--- | :--- | :--- |
| ぞろ目チャレンジ | ZoromeGame.vue | 初級 | 2〜5個 | GameRecord系 |
| 50ゲーム | FiftyGame.vue | 中級 | 2個 | GameRecord系 |
| サイコロ早押し計算 | QuickMathGame.vue | 初級 | 2〜15個 | GameRecord系 |
| ダイスアドベンチャー | DiceAdventureGame.vue | 中級 | 2個 | 汎用データ系 |
| 丁半博打 | ChoHanGame.vue | 中級 | 2個 | 汎用データ系 |
| サイコロポーカー | DicePokerGame.vue | 中級 | 5個 | 汎用データ系 |
| ブタのしっぽ | PigGame.vue | 初級 | 1個 | 汎用データ系 |

#### 主要ゲームの特徴

**ぞろ目チャレンジ (ZoromeGame.vue)**
サイコロ2〜5個を選択し、ぞろ目が出るまでの回数を記録する。個数ごとの確率を分数と
パーセントで表示する。最小構成の参考実装として位置づけている。

**サイコロ早押し計算 (QuickMathGame.vue)**
サイコロ2〜15個の合計を暗算で回答する。タイム計測と正解率記録があり、
数字キーとEnterのみで操作を完結できる。個数別に統計を保存する。

**ダイスアドベンチャー (DiceAdventureGame.vue)**
クトゥルフ神話TRPGのダイスシステムを模した統計型ゲーム。D100判定、
ランダム生成した冒険者のステータス、HP/SAN値管理を持つ。
世界観に合わせ、例外的にダークテーマUIを採用している。

**サイコロポーカー (DicePokerGame.vue)**
5個のサイコロで13ラウンド、Yahtzee風に役を作り分ける。
サイコロのキープ操作は `DiceTray` の `clickable` と `dice-click` イベントで実装している。

### 4. ページ構成
- **トップページ**: おすすめゲーム、最近追加ゲーム、特徴紹介
- **ゲーム一覧**: カテゴリー別・難易度別表示
- **ゲーム詳細**: Markdown形式のルール説明 + Vueゲームコンポーネント
- **aboutページ**: サイト説明

---

## コアシステム

### Content Collections
Astroの Content Collections を使用してゲーム情報を管理：

```typescript
// src/content/config.ts
const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    component: z.string(),                    // 例: 'ZoromeGame.vue'
    description: z.string(),
    quickRule: z.string(),                    // ゲーム直前に出す要点（2〜3文）
    players: z.object({                       // 実物で遊ぶときの人数
      min: z.number().min(1),
      max: z.number().optional(),
    }),
    equipment: z.string().array().min(1),     // 実際に遊ぶために必要な道具
    duration: z.string(),
    difficulty: z.enum(['初級', '中級', '上級', '超級']),
    diceCount: z.number().min(1).max(15),
    category: z.enum(['運ゲー', '戦略ゲー', '計算ゲー', 'パーティーゲー',
                      'TRPG', '統計', 'ロールプレイ']).array(),
    tags: z.string().array().optional(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    featured: z.boolean().default(false),
    config: z.record(z.any()).optional(),     // ゲーム固有の設定
  }),
});
```

`config` に書いた値は `[slug].astro` でそのままpropsに展開されるため、
ゲームの調整値（目標点、ラウンド数など）をコンポーネントを触らずに変更できる。

`players` と `equipment` は、実物のサイコロで遊ぶ人のための情報。
ゲームカード、ゲームページの「実物のサイコロで遊ぶ」節、
印刷用ルールカードの3か所で使われる。

### 実物で遊ぶことを主役に戻す

このサイトは元々「実際のサイコロで遊んでね」という立場で作られたが、
その情報がMarkdown本文の奥に埋もれ、ブラウザゲームより下にあった。
実物で遊びたい人にも、ブラウザで遊びたい人にも届かない状態だった。

現在は次の3つで実物のプレイを支えている。

1. **frontmatterの構造化** — `equipment`（面数と個数を明示）と `players`
2. **「実物のサイコロで遊ぶ」節** — ゲーム本体の直下に独立して配置
3. **印刷用ルールカード** — 必要なもの・人数・ルール・得点記録表を1枚に

印刷は `d-none d-print-block` / `d-print-none` で切り替えており、
専用ページもカスタムCSSも持たない。印刷するとルールカードだけが出る。

ゲーム一覧を `diceCount` でグルーピングしているのも同じ理由で、
実物で遊ぶときは「手元に何個あるか」が最初の制約になるため。

### ストレージ抽象レイヤー

将来のサーバー連携に備え、`IStorage` を介してのみ永続化を行う。
ゲームによって記録の性質が異なるため、2系統を用意している。

```typescript
// src/lib/storage/LocalStorage.ts
export class LocalStorageAdapter implements IStorage {
  // 試行回数型: 「小さいほど良い」記録（達成までの回数、タイム）
  async saveRecord(record: GameRecord): Promise<void>
  async getRecords(gameSlug: string, diceCount?: number): Promise<GameRecord[]>
  async getStats(gameSlug: string, diceCount?: number): Promise<GameStats>
  async clearRecords(gameSlug: string): Promise<void>

  // 汎用データ型: 得点型・独自の履歴構造
  async saveData<T>(key: string, value: T): Promise<void>
  async getData<T>(key: string): Promise<T | null>
  async clearData(key: string): Promise<void>
}
```

保存先キーはいずれも `dice-games:` プレフィックスを付ける。
`getRecords` 系は最新100件のみ保持する。

**2系統に分かれている理由**: `getStats()` の `bestScore` は `Math.min(attempts)` で
算出しており、「試行回数が少ないほど良い」という前提を持つ。
サイコロポーカーのように高得点ほど良いゲームには適用できないため、
任意の構造を保存できる汎用データ系を後から追加した。

### サイコロユーティリティ

```typescript
// src/lib/utils/dice.ts
export function rollDice(): DiceValue
export function rollMultipleDice(count: number): DiceValue[]
export function isZorome(values: DiceValue[]): boolean
export function calculateZoromeProbability(diceCount: number): number
export function formatProbability(probability: number): string
export function formatProbabilityAsFraction(diceCount: number): string
```

ぞろ目判定と確率計算に特化している。D100やダメージダイスなど
ゲーム固有のダイス処理は、各ゲームコンポーネント内に置いている。

---

## Bootstrap 5 スタイリング方針

### 基本ルール
1. **Bootstrap 5.3をCDNで使用** - カスタムビルド不要
2. **カスタムCSSは最小限** - Bootstrapクラスで実装
3. **明るい背景と暗いテキスト** - `bg-light`, `bg-white`, `text-dark`のみ使用
4. **暗い色の使用禁止** - `bg-dark`, `text-light`等は使わない（フッター除く）

### 主要なBootstrapコンポーネント
- レイアウト: `container`, `row`, `col-*`, `d-flex`
- ボタン: `btn btn-primary`, `btn btn-secondary`
- カード: `card`, `card-body`, `card-title`
- ナビ: `navbar`, `nav-link`
- バッジ: `badge bg-*`

### カスタムCSSが許可される場合
- サイコロコンポーネント（ドットパターン、フェルト質感）
- ゲーム固有のビジュアル要素
- Vueコンポーネントの `<style scoped>` 内のみ

### 暗い色を使っている例外
新規に増やさないこと。

- **DiceTray.vue**: カジノ風の緑フェルト背景
- **DiceAdventureGame.vue**: クトゥルフ神話TRPGの世界観に合わせたダークテーマ

---

## アクセシビリティ対応

### 必須項目
```vue
<!-- サイコロの出目 -->
<div
  class="dice"
  :aria-label="`サイコロ${index + 1}: ${value}の目`"
  role="img"
>
  {{ value }}
</div>

<!-- ゲーム結果 -->
<div
  class="result-message"
  role="status"
  aria-live="polite"
>
  {{ resultMessage }}
</div>

<!-- ボタン -->
<button
  @click="roll"
  :disabled="!canRoll"
  :aria-busy="isRolling"
  type="button"
>
  サイコロを振る
</button>
```

クリック可能なサイコロは `role="button"` と `tabindex` を付与し、
Enter / Space キーでも操作できるようにしている（`DiceDisplay.vue`）。

---

## 開発ワークフロー

### セットアップ
```bash
npm install
```

Node.js 22以上が必要（Astro 5.14のengines: `18.20.8 || ^20.3.0 || >=22.0.0`）。

### 開発コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番用ビルド
npm run preview  # ビルドをプレビュー
```

### 新しいゲーム追加手順

作るのは2ファイルだけで、既存ファイルの編集は不要。

1. `src/content/games/game-name.md` を作成（frontmatter + 詳しいルール）
2. `src/components/games/GameName.vue` を作成
3. ローカルで確認: `npm run dev`
4. ビルド確認: `npm run build && npm run preview`

mdの `component` に書いたファイル名を `GameHost.vue` が解決するため、
ページ側への登録作業はない。名前が合わなければビルドが失敗する。

frontmatterの各項目の書き方は [`CLAUDE.md`](../CLAUDE.md) の
「新しいゲームの追加手順」を参照。

### 検証時の注意

`npm run build` はAstroファイルの型は検査するが、**.vue内のTypeScriptは検査しない**。
実際に、存在しないストレージメソッドの呼び出しがビルドを通過し、
実行時まで発覚しなかった事例がある。
.vueのロジックを変更したら、必ずブラウザで該当ゲームを最後まで動かして確認すること。

---

## デプロイ設定

### Astro設定
```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [vue()],
  site: 'https://seudon.github.io',
  base: '/dice-games-hiroba',
  build: {
    assets: '_assets',
  },
});
```

`base` を設定しているため、内部リンクは `import.meta.env.BASE_URL` を
前置する必要がある（過去にリンク切れを起こした経緯がある）。

### GitHub Actions

`.github/workflows/deploy.yml` が main へのpushで起動し、
ビルド成果物 `dist/` を GitHub Pages へデプロイする。

- build ジョブ: checkout → setup-node (Node 24) → `npm ci` → `npm run build` → アーティファクトのアップロード
- deploy ジョブ: `actions/deploy-pages` でデプロイ

`concurrency` で同時実行を1つに制限し、デプロイの競合を防いでいる。

---

## 今後の拡張計画

### 追加候補のゲーム
- チンチロリン (サイコロ3個、役判定)
- サイコロ野球
- メキシコ

### 高度な機能
1. サーバー連携 (ApiStorageAdapter) — `IStorage` を実装すれば差し替え可能
2. ランキング機能
3. SNSシェア機能
4. 印刷最適化CSS
5. ダークモード対応

### 整理したい負債
- `games/index.astro` のカテゴリー一覧とzodスキーマのenumを揃える
- 得点型ゲームの統計構造が各コンポーネントに分散しているため、
  3件を超えたら共通化を検討する

---

## 開発時の注意事項

### やってはいけないこと
1. ❌ 早すぎる共通化（明確な重複が3箇所以上出るまで待つ）
2. ❌ React等の他フレームワークを使用
3. ❌ LocalStorageを直接使用（必ずAdapterを経由）
4. ❌ 暗い色クラスの使用（`bg-dark`, `text-light`等）
5. ❌ インラインスタイルの使用
6. ❌ `DiceDisplay` に `:dice` を渡す（出目が表示されなくなる。`DiceTray` を使う）

### 必ず守ること
1. ✅ TypeScript strictモード
2. ✅ aria属性の適切な使用
3. ✅ レスポンシブデザイン（768px以下でモバイル対応）
4. ✅ 複雑なロジックには日本語コメント
5. ✅ try-catchでエラーハンドリング
6. ✅ ファイル修正後は開発サーバーを再起動

---

## まとめ

この設計に従うことで：

✅ **段階的な開発**: 1ゲームずつ確実に完成
✅ **将来の拡張性**: ストレージ抽象化で柔軟な設計
✅ **メンテナンス性**: Bootstrap統一で一貫性
✅ **アクセシビリティ**: 最初から組み込み
✅ **パフォーマンス**: Astro Islandsで最適化

詳細な実装ガイドは [`CLAUDE.md`](../CLAUDE.md) を参照してください。
