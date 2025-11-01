# サイコロゲーム広場 - 設計書

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

## プロジェクト構成

```
dice-games-hiroba/
├── src/
│   ├── content/
│   │   ├── config.ts                    # Content Collections型定義
│   │   └── games/                       # ゲーム情報(Markdown)
│   │       ├── zorome-challenge.md
│   │       └── fifty-game.md
│   │
│   ├── components/
│   │   ├── common/                      # 共通コンポーネント
│   │   │   ├── DiceDisplay.vue         # サイコロ単体表示
│   │   │   └── DiceTray.vue            # サイコロトレイ
│   │   ├── games/                       # ゲームコンポーネント
│   │   │   ├── ZoromeGame.vue          # ぞろ目チャレンジ
│   │   │   └── FiftyGame.vue           # 50ゲーム
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
├── public/
│   └── favicon.svg
│
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── CLAUDE.md                           # プロジェクト実装ガイド
└── README.md
```

---

## 実装済み機能

### 1. レイアウトシステム
- **BaseLayout.astro**: Bootstrap 5.3をCDNから読み込み、全ページ共通レイアウト
- **GameLayout.astro**: ゲームページ専用レイアウト

### 2. 共通コンポーネント
- **DiceDisplay.vue**: ドットベースのサイコロ表示（1の目は赤、2-6は黒）
- **DiceTray.vue**: カジノ風緑フェルトのサイコロトレイ
- **GameCard.astro**: ゲーム一覧用カード

### 3. 実装済みゲーム

#### ぞろ目チャレンジ (ZoromeGame.vue)
- サイコロ2〜5個を選択
- ぞろ目が出るまでの回数を記録
- LocalStorageで統計を保存
- 難易度: 初級〜超級

#### 50ゲーム (FiftyGame.vue)
- サイコロ2個で合計を50に近づける
- バースト（50超過）の判定
- 累積スコア管理
- 難易度: 中級

#### サイコロ早押し計算 (QuickMathGame.vue)
- サイコロ2〜15個を選択可能
- 合計を素早く計算して回答
- タイム計測、正解率記録
- キーボードのみで操作可能
- 個数別統計記録
- 難易度: 初級（個数により調整可能）

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
  schema: z.object({
    title: z.string(),
    component: z.string(),
    description: z.string(),
    players: z.string(),
    duration: z.string(),
    difficulty: z.enum(['初級', '中級', '上級', '超級']),
    diceCount: z.number(),
    category: z.enum(['運ゲー', '戦略ゲー', '計算ゲー', 'パーティーゲー']).array(),
    tags: z.string().array().optional(),
    publishedAt: z.date(),
    featured: z.boolean().default(false),
    config: z.record(z.any()).optional(),
  }),
});
```

### ストレージ抽象レイヤー
将来のサーバー連携に備えた設計：

```typescript
// src/lib/storage/LocalStorage.ts
export class LocalStorageAdapter implements IStorage {
  async saveRecord(record: GameRecord): Promise<void>
  async getRecords(gameSlug: string, diceCount?: number): Promise<GameRecord[]>
  async getStats(gameSlug: string, diceCount?: number): Promise<GameStats>
  async clearRecords(gameSlug: string): Promise<void>
}
```

### サイコロユーティリティ
再利用可能なサイコロ関連関数：

```typescript
// src/lib/utils/dice.ts
export function rollDice(): DiceValue
export function rollMultipleDice(count: number): DiceValue[]
export function isZorome(values: DiceValue[]): boolean
export function calculateZoromeProbability(diceCount: number): number
```

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

---

## 開発ワークフロー

### セットアップ
```bash
npm create astro@latest . -- --template minimal --typescript strict --yes
npx astro add vue --yes
npm install @vueuse/core
npm install -D sass
```

### 開発コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番用ビルド
npm run preview  # ビルドをプレビュー
```

### 新しいゲーム追加手順
1. `src/content/games/game-name.md` を作成
2. `src/components/games/GameName.vue` を作成
3. ローカルで確認: `npm run dev`
4. ビルド確認: `npm run build && npm run preview`

---

## デプロイ設定

### Astro設定
```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [vue()],
  site: 'https://yourusername.github.io',
  base: '/dice-games-hiroba',
});
```

### GitHub Actions
`.github/workflows/deploy.yml` で自動デプロイを設定（詳細は別途）

---

## 今後の拡張計画

### 追加予定のゲーム
- チンチロリン (サイコロ3個、役判定)
- サイコロ野球
- メキシコ

### 高度な機能
1. サーバー連携 (ApiStorageAdapter)
2. ランキング機能
3. SNSシェア機能
4. 印刷最適化CSS
5. ダークモード対応

---

## 開発時の注意事項

### やってはいけないこと
1. ❌ 早すぎる共通化（3ゲーム未満での抽象化）
2. ❌ React等の他フレームワークを使用
3. ❌ LocalStorageを直接使用（必ずAdapterを経由）
4. ❌ 暗い色クラスの使用（`bg-dark`, `text-light`等）
5. ❌ インラインスタイルの使用

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

詳細な実装ガイドは `CLAUDE.md` を参照してください。
