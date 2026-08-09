# サイコロゲーム広場 - プロジェクト実装ガイド

## プロジェクト概要

子供から高齢者まで楽しめるサイコロゲーム集のWebサイト。
現在7ゲームを公開中: https://seudon.github.io/dice-games-hiroba/

### 技術スタック

- **フレームワーク**: Astro 5.x（静的サイト生成）
- **UIコンポーネント**: Vue 3 (Composition API) - `client:visible` で島ハイドレーション
- **スタイリング**: Bootstrap 5.3 (CDN)
- **TypeScript**: strict mode
- **ホスティング**: GitHub Pages（`main` へのpushで自動デプロイ）

### 設計方針

1. **段階的実装**: 1ゲームを完成させてからパターン化
2. **Vue統一**: フレームワーク混在を避け、Vueに統一
3. **アクセシビリティファースト**: 最初から対応を組み込む
4. **Bootstrap活用**: CDN経由でBootstrap 5.3を使用
5. **将来の拡張性**: サーバー連携を見据えた抽象レイヤー

## コミュニケーションルール

**日本語でやり取りする** - 説明・質問・回答・コード内コメント・ドキュメントすべて日本語。

---

## アーキテクチャ

### ゲーム1つ = Markdown 1枚 + Vueコンポーネント1枚

```
src/content/games/{slug}.md      frontmatter（メタ情報 + config）+ 本文（ルール説明）
        ↓ getCollection() / src/content/config.ts のzodスキーマで型付け
src/pages/games/[slug].astro     全ゲームページを静的生成
        ↓ data.component の文字列で分岐し、config をpropsに展開
src/components/games/{Name}.vue  client:visible でハイドレート
```

**ゲームの解決は自動**。`[slug].astro` は `GameHost.vue` だけをマウントし、
実際のゲームは `GameHost` が `import.meta.glob` で動的に読み込む。
**ゲームを追加しても `[slug].astro` を編集する必要はない。**

Astroの `client:` ディレクティブは静的にimportされたコンポーネントしか受け付けないため
（動的に解決すると `NoMatchingImport` になる）、選択の責任をVue側に置いている。
`GameHost` は `client:only="vue"` でマウントする。

component名が解決できない場合は `[slug].astro` がビルド時に例外を投げる。
綴り間違いや置き忘れはビルドで止まるので、無言で空欄になることはない。

### ゲームページの構成（順序を崩さない）

```
ヘッダー（title / difficulty / category / description / メタ情報）  ← 1画面に収まる高さ
ゲーム本体                                                        ← ファーストビュー内
クイックルール（frontmatterの quickRule）
実物のサイコロで遊ぶ（equipment / players / 印刷ボタン）
詳しいルールと戦略（<details>で折りたたみ、本文のMarkdown）
ゲーム一覧へ戻る

［印刷時のみ］ルールカード（d-none d-print-block）
```

画面用の要素は `d-print-none` で囲んであり、印刷すると
ルールカード1枚だけが出る。ナビゲーションとフッターも印刷では消える。

**ゲーム本体より上に要素を足さないこと。** 以前はルール全文が上にあり、
スマホでゲームに到達するまで最大6.6画面ぶんのスクロールが必要だった。
クイックルールをゲームの下に置いているのも、サイコロと操作ボタンを
スマホの1画面に収めるため。ヘッダーに項目を増やすと再び壊れる。

**印刷用ルールカードに見出しタグ（h1/h2）を使わない。** ページ側が既に
`<h1>` を出しているため、同じページ内にH1が2つできてしまう。
`<div class="h3">` のようにクラスだけで見た目を揃える。

### ディレクトリ構成

```
src/
├── components/
│   ├── common/    DiceDisplay.vue（単体サイコロ）, DiceTray.vue（トレイ）
│   ├── games/     各ゲームのVueコンポーネント
│   └── ui/        GameCard.astro（一覧のカード）
├── content/
│   ├── config.ts  Content Collectionsのzodスキーマ
│   └── games/     ゲーム情報のMarkdown
├── layouts/       BaseLayout.astro（Bootstrap CDN・ナビ・フッター）, GameLayout.astro
├── lib/
│   ├── storage/   LocalStorage.ts（LocalStorageAdapter）
│   └── utils/     dice.ts（乱数・ぞろ目判定・確率計算）
├── pages/         index.astro, about.astro, games/index.astro, games/[slug].astro
└── types/         game.ts（DiceValue, Dice, GameRecord, GameStats, IStorage）
```

---

## 新しいゲームの追加手順

作るのは次の2ファイルだけ。既存ファイルの編集は不要。

### 1. `src/content/games/{slug}.md` を作成

```yaml
---
title: ゲーム名
component: NewGame.vue          # ファイル名を正確に
description: 一行説明
quickRule: これだけ読めば遊べる要点を2〜3文で   # 必須
players:                        # 実物で遊ぶときの人数。maxを省くと「◯人〜」
  min: 2
  max: 6
equipment:                      # 実際に遊ぶために必要な道具（必須）
  - 6面サイコロ 2個
  - 紙とペン（得点の記録用）
duration: 5-10分
difficulty: 初級                # 初級 / 中級 / 上級 / 超級
diceCount: 2                    # 1〜15。ゲーム一覧のグルーピングに使う
category: [運ゲー]              # 下記「カテゴリーの注意」参照
tags: [タグ1, タグ2]            # 任意
publishedAt: 2025-01-20
featured: false                 # true でトップページの「おすすめ」に載る
config:                         # 任意。そのままpropsに展開される
  targetScore: 100
---

（本文に詳しいルール・戦略をMarkdownで記述。ゲームの下に折りたたんで表示される）
```

**本文は `##` から書き始める。** ページ側が `<h1>` にtitleを出すため、
本文にH1を置くとページ内にH1が2つできる。

**`quickRule` は必ず書く。** ゲームの直前に表示される唯一のルール説明であり、
多くの利用者はこれだけを読んで遊ぶ。長い説明は本文側に書く。

**`equipment` は実物で遊ぶ人向けの情報。** 「6面サイコロ 2個」のように
面数と個数を明示する。多面ダイスを使うゲーム（ダイスアドベンチャー）もあるため、
「サイコロ2個」とだけ書かない。ゲームカードと印刷用ルールカードにそのまま出る。

**カテゴリー**: `src/content/config.ts` のenumが
`運ゲー / 戦略ゲー / 計算ゲー / パーティーゲー / TRPG / 統計 / ロールプレイ` を許可する。
どれを選んでもゲームカードにバッジとして表示される。
一覧ページの並びは `diceCount` によるグルーピングなので、カテゴリーの選択は表示順に影響しない。

### 2. `src/components/games/NewGame.vue` を作成

- propsは `gameSlug: string` を必ず受け取る（記録保存キーに使う）
- `config` に書いた値は同名propsとして届く（`GameHost` が `v-bind` で展開する）
- サイコロ表示は必ず `DiceTray` を使う（後述の絶対遵守ルール）
- 既存ゲームを土台にする。最小構成は `ZoromeGame.vue`（289行）が読みやすい

### 登録作業は不要

`GameHost.vue` が `src/components/games/` を走査して解決するため、
`[slug].astro` への追記はいらない。`.vue` を置いてmdの `component` に
ファイル名を書けば表示される。

綴りが合わないとビルドが失敗し、利用可能なコンポーネント名が一覧表示される。

---

## 重要な実装ルール

### ❌ やってはいけないこと

1. **早すぎる共通化をしない** - 各ゲームは独立実装。共通化は明確な重複が3箇所以上出てから
2. **Reactや他のフレームワークを使わない** - Vueのみ
3. **LocalStorageを直接使わない** - 必ず `LocalStorageAdapter` を経由（後述の「記録・統計の保存」参照）
4. **`DiceDisplay` に `:dice` を渡さない** - 出目が表示されなくなる（後述）

### ✅ 必ず守ること

1. **TypeScript strictモード** - すべての型を明示
2. **アクセシビリティ** - aria属性を適切に使用
3. **レスポンシブデザイン** - 768px以下でモバイル対応
4. **コメント** - 複雑なロジックには日本語コメント
5. **エラーハンドリング** - try-catchで適切にエラー処理
6. **サイコロコンポーネントの正しい使用** - 下記セクション参照

---

### 🎲 サイコロコンポーネントの正しい使用方法（絶対遵守）

**❗ サイコロ表示で出目が表示されない不具合を防ぐため、このルールを厳守すること ❗**

過去に実際に発生している（commit 61d94dd「fix: resolve dice display issue in PigGame」）。

#### 1. 基本ルール：DiceTrayコンポーネントを使用する

**✅ 正しい方法（推奨）:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { Dice } from '../../types/game';
import DiceTray from '../common/DiceTray.vue';

// サイコロは必ず配列で定義
const dice = ref<Dice[]>([
  { id: 0, value: 1, isRolling: false }
]);
</script>

<template>
  <DiceTray :dice="dice" />
</template>
```

**理由:**
- ✅ カジノ風の緑フェルト背景で見栄えが良い
- ✅ 1個でも複数個でも対応可能
- ✅ レスポンシブレイアウト自動調整（1〜15個対応）
- ✅ 他のゲームコンポーネントと統一された実装
- ✅ 将来的な拡張が容易

#### 2. ❌ やってはいけないこと

**間違った使い方（出目が表示されない）:**
```vue
<!-- ❌ DiceDisplayに直接Diceオブジェクトを渡す -->
<script setup lang="ts">
const dice = ref<Dice>({ id: 0, value: 1, isRolling: false });
</script>

<template>
  <DiceDisplay :dice="dice" size="lg" />
  <!-- ❌ DiceDisplayには:diceというpropが存在しない！ -->
</template>
```

**なぜダメなのか:**
- `DiceDisplay.vue` のpropsは `value` / `size` / `isRolling` / `isKept` / `clickable` の5つだけ
- `dice` オブジェクトを受け取るpropは存在しない
- そのため `:dice="dice"` と渡しても `value` が未定義になり、出目が表示されない

#### 3. DiceDisplayを直接使う場合（特殊ケース）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { DiceValue } from '../../types/game';
import DiceDisplay from '../common/DiceDisplay.vue';

const diceValue = ref<DiceValue>(1);
const isRolling = ref(false);
</script>

<template>
  <!-- ✅ 個別propsで渡す -->
  <DiceDisplay :value="diceValue" :isRolling="isRolling" size="lg" />
</template>
```

**注意点:** フェルト背景がないため見栄えが劣る。単一サイコロでも `DiceTray` を推奨。

#### 4. データ型の定義

```typescript
// src/types/game.ts
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface Dice {
  id: number;
  value: DiceValue;
  isRolling: boolean;
}
```

**重要:** `dice` は**必ず配列**で管理: `ref<Dice[]>`。
単一サイコロでも `ref<Dice[]>([{ id: 0, value: 1, isRolling: false }])`。

#### 5. DiceTrayの機能

| props | 型 | 用途 |
|---|---|---|
| `dice` | `Dice[]` | 表示するサイコロ（必須） |
| `keptDice` | `boolean[]` | キープ中のサイコロ（インデックス対応） |
| `clickable` | `boolean` | クリック可能にする |

emit: `dice-click`（引数: index）。サイコロポーカーのキープ操作で使用。

サイズはサイコロ個数（`data-count` 属性）で自動調整され、1〜15個に対応。
16個以上を渡すとグリッド指定が効かずレイアウトが崩れる。

#### 6. 実装時のチェックリスト

- [ ] `DiceTray` コンポーネントをimport
- [ ] `dice` の型は `ref<Dice[]>`（配列）
- [ ] サイコロ1個の場合も配列で定義
- [ ] 他のゲーム（ZoromeGame.vue、QuickMathGame.vueなど）を参考にする
- [ ] `DiceDisplay` を直接使わない（特別な理由がない限り）

---

### 記録・統計の保存

`src/lib/storage/LocalStorage.ts` の `LocalStorageAdapter` が `IStorage` を実装する。
キーは `dice-games:{gameSlug}`、最新100件のみ保持。

**用途によって2系統を使い分ける。**

#### A. 試行回数型 — GameRecord系

「達成までの回数」「タイム」のように**小さいほど良い**記録を扱う。

```typescript
saveRecord(record: GameRecord): Promise<void>
getRecords(gameSlug: string, diceCount?: number): Promise<GameRecord[]>
getStats(gameSlug: string, diceCount?: number): Promise<GameStats>
clearRecords(gameSlug: string): Promise<void>
```

**重要な前提**: `getStats()` の `bestScore` は `Math.min(attempts)` で算出する。
ぞろ目チャレンジ（達成までの回数）やサイコロ早押し計算（タイム）には合うが、
**得点を競うゲームには合わない**。使用中: ZoromeGame / FiftyGame / QuickMathGame。

#### B. 任意形式 — 汎用データ系

得点型のゲームや、独自の履歴構造を持つゲームはこちら。

```typescript
saveData<T>(key: string, value: T): Promise<void>
getData<T>(key: string): Promise<T | null>   // 未保存・JSON破損時はnull
clearData(key: string): Promise<void>
```

保存先キーは `dice-games:{key}` になる。keyの付け方はゲーム側で決める。

| ゲーム | key | 内容 |
|---|---|---|
| DicePokerGame | `{slug}-stats` | 最高得点・平均点・ヨットの回数 |
| PigGame | `{slug}-stats` | 最少ターン数・平均ターン数・最高ターン得点 |
| ChoHanGame | `{slug}` | 総ゲーム数・最高所持金・破産回数 |
| DiceAdventureGame | `{slug}_events_{イベント数}` | 冒険者ごとの結果履歴 |

**`getData` は必ず型引数を付ける**（`getData<Stats>(key)`）。省略すると戻り値が
`unknown` になり、strictモードで型エラーになる。

`saveData` は保存失敗時に例外を投げる。統計の保存失敗でゲーム進行を止めないよう、
呼び出し側でtry-catchして `console.error` に留めること（既存4ゲームがこの形）。

**どちらの系統でも `localStorage` を直接触らない。** 必要な操作がなければ
`IStorage` と `LocalStorageAdapter` の両方にメソッドを追加する。

---

### 🔴 開発サーバー再起動ルール（絶対遵守）

**❗ すべてのファイル修正後は必ず開発サーバーを再起動すること ❗**

1. **修正後の必須手順**:
   ```bash
   # 1. 開発サーバーを停止（KillShellツールまたはCtrl+C）
   # 2. 開発サーバーを再起動
   npm run dev
   ```

2. **再起動が必須のケース**: .vueファイル（特にscoped style）、.astroファイル、
   TypeScriptファイル、設定ファイル、Content Collections関連 — つまりすべての修正

3. **なぜ必須なのか**:
   - Astroの自動リロード（HMR）は**完全には動作しない**
   - Vueコンポーネントのscoped styleは特に反映されにくい
   - Content Collectionsの変更は再起動しないと認識されない

4. **作業フロー**: `ファイル修正 → 開発サーバー再起動 → ブラウザで確認`

**⚠️ このルールを忘れると、修正が反映されずユーザーに迷惑をかけます。必ず徹底してください。**

---

## Bootstrap 5 スタイリングルール

### 基本方針

- **Bootstrap 5.3をCDNで使用**: カスタムビルド不要（`BaseLayout.astro` で読み込み）
- **カスタムCSSは最小限**: Bootstrapクラスのみで実装
- **厳格な色ルール**: 明るい背景と暗いテキストのみ使用

### 必ず使用するBootstrapコンポーネントクラス

**レイアウト:** `container`, `row`, `col-md-*`, `d-flex`, `justify-content-*`,
`align-items-*`, `p-*`, `m-*`, `gap-*`

**コンポーネント:** `btn btn-primary` / `btn-secondary` / `btn-lg`, `card` / `card-body` /
`card-title`, `navbar`, `form-label` / `form-control` / `form-select`,
`badge` + `bg-*`, `alert` + `alert-info` / `alert-success` / `alert-warning`

### 厳格な色ルール（絶対遵守）

**許可される色クラス:**
- **背景**: `bg-light`, `bg-white` のみ
- **テキスト**: `text-dark` のみ
- **ボタン**: `btn-primary`, `btn-secondary` のみ

**絶対に使用禁止:**
- ❌ `bg-dark`, `bg-black`
- ❌ `text-light`, `text-white`（フッターなど一部例外を除く）
- ❌ その他の暗い色クラス

**認められている例外**（新規に増やさない）:
- `DiceTray.vue` — カジノ風の緑フェルト背景
- `DiceAdventureGame.vue` — クトゥルフ神話TRPGの世界観に合わせたダークテーマ

### カスタムCSS

Bootstrapクラスで実現できる場合は必ずBootstrapを使う。
どうしても必要な場合のみVueコンポーネントの `<style scoped>` に記述する
（サイコロのドットパターン、フェルト質感などのビジュアル要素）。

### やってはいけないこと（スタイリング）

❌ BootstrapコンポーネントがあるのにカスタムCSSで実装
❌ インラインスタイル（`style="..."`）の使用
❌ `<style>` タグの使用（Vueの `<style scoped>` 以外）
❌ 暗い色クラス（`bg-dark`, `text-light` 等）の使用
❌ `!important` の使用

---

## Git管理ワークフロー

**詳細は [`docs/git-workflow.md`](docs/git-workflow.md) を参照。**

### 1. mainブランチへの直接コミット禁止

mainには**絶対に**直接プッシュしない。すべての変更は機能ブランチ + PR を経由する。

### 2. 開発フロー

```bash
git checkout -b feat/feature-name      # または fix/bug-name
git add .
git commit -m "feat: implement feature"
git push origin feat/feature-name
gh pr create --title "タイトル" --body "説明"
# PRをレビュー・マージ後
git checkout main && git pull origin main
git branch -d feat/feature-name
```

mainへのマージで GitHub Actions（`.github/workflows/deploy.yml`）が走り、
GitHub Pages へ自動デプロイされる。

### 3. コミットメッセージ規約

Conventional Commits形式: `feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`

### 4. ブランチ命名規則

`feat/機能名` / `fix/バグ名` / `docs/ドキュメント名` / `refactor/対象名`

### GitHub CLI (gh)

```bash
gh pr create --title "タイトル" --body "説明"
gh pr list
gh pr view [番号]
gh pr merge [番号]
gh pr status
```

未インストールの場合のセットアップ手順は [`docs/git-workflow.md`](docs/git-workflow.md) を参照。

---

## 実装済みゲーム（7種）

| ゲーム | slug | コンポーネント | 行数 | 特徴 |
|---|---|---|---|---|
| ぞろ目チャレンジ | zorome-challenge | ZoromeGame.vue | 289 | 2〜5個選択、確率表示。最小構成の参考実装 |
| 50ゲーム | fifty-game | FiftyGame.vue | 326 | 累積スコア、バースト判定 |
| サイコロ早押し計算 | quick-math | QuickMathGame.vue | 521 | 2〜15個選択、タイム計測、キーボード操作 |
| ダイスアドベンチャー | dice-adventure | DiceAdventureGame.vue | 1020 | CoC TRPG風D100判定、HP/SAN管理、ダークテーマ |
| 丁半博打 | cho-han | ChoHanGame.vue | 527 | 資金管理、ベット、最大10ラウンド |
| サイコロポーカー | dice-poker | DicePokerGame.vue | 739 | Yahtzee風13役、キープ操作、3回振り直し |
| ブタのしっぽ | pig-game | PigGame.vue | 404 | 1が出たら没収のチキンレース、目標100点 |

### 共通コンポーネント (src/components/common/)

**DiceDisplay.vue** - 単体サイコロ表示
- ドットベースの表示（1=赤丸、2-6=黒丸）
- サイズ: sm / md / lg
- 回転アニメーション、キープ表示、クリック可能状態に対応
- `clickable` 時は `role="button"` + Enter/Space キー操作 + aria-label

**DiceTray.vue** - サイコロトレイ
- カジノ風緑フェルト背景、フェルト質感の擬似要素
- サイコロ個数に応じたグリッド自動調整（1〜15個）
- 768px以下ではモバイル用に3列固定へ切り替え

---

## 既知の課題

新規実装時に踏まないよう記載する。手を入れる際はこの項目も更新すること。

### 1. .vueファイルは型検査されない

`npm run build` はAstroファイルの型は見るが、**.vue内のTypeScriptは検査しない**。
実際、存在しないストレージメソッドの呼び出しがビルドを通過し、
実行時まで発覚しなかった事例がある（PigGame / DicePokerGame の統計保存、2026-08修正済み）。

.vueのロジックを変更したら、ビルドが通ったことを根拠にせず、
**必ずブラウザで該当ゲームを最後まで動かして確認する**。

### 2. `getStats()` が高得点型ゲームに合わない

`bestScore` が `Math.min` 固定のため、得点が高いほど良いゲームでは使えない。
得点型は汎用データ系（`saveData` / `getData`）を使うこと。

### 3. 統計UIが各ゲームに重複実装されている

7ゲームがそれぞれ似た統計カード群を持っている。共通化の目安（3件）は
とうに超えているため、次にゲームを追加するときに切り出しを検討する。

---

## 参考ドキュメント

- **設計書**: [`docs/dice-games-design-doc.md`](docs/dice-games-design-doc.md)
- **Git運用ワークフロー**: [`docs/git-workflow.md`](docs/git-workflow.md)
- **Astro公式**: https://docs.astro.build
- **Vue 3公式**: https://vuejs.org
- **GitHub CLI**: https://cli.github.com/manual/

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動
npm run build     # ビルド
npm run preview   # ビルド結果のプレビュー
```

## 現在の状態

- [x] プロジェクトセットアップ（Astro 5.x + Vue 3）
- [x] 基盤ファイル（型定義・dice.ts・LocalStorageAdapter・Content Collections）
- [x] レイアウトコンポーネント（Bootstrap 5 CDN統合）
- [x] 共通サイコロコンポーネント（DiceDisplay.vue / DiceTray.vue）
- [x] ゲーム7種実装
- [x] トップページ / ゲーム一覧 / aboutページ
- [x] GitHub Pagesデプロイ（GitHub Actionsで自動化、公開済み）
- [x] ストレージの統一（汎用 `saveData` / `getData` 追加、直接localStorage使用の解消）
- [x] README・設計書の更新
- [x] GitHub Actionsのバージョン更新（CIのNode.jsは24）
