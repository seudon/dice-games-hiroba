# サイコロゲーム広場

子供から高齢者まで楽しめるサイコロゲーム集のWebサイト

**🌐 公開サイト**: https://seudon.github.io/dice-games-hiroba/

ブラウザ上でサイコロゲームを楽しめます。実際のサイコロがなくても、すぐに遊べます！

## 🎲 プロジェクト概要

様々なサイコロゲームのルール、記録表、ブラウザゲームを提供するWebサイトです。
実際のサイコロで遊ぶのが一番楽しいですが、サイコロがない時でもブラウザ上で遊ぶことができます。

現在7種類のゲームを公開中。記録はブラウザのLocalStorageに保存されるため、
アカウント登録なしで自分の記録に挑戦できます。

## 🚀 技術スタック

- **フレームワーク**: Astro 5.x（静的サイト生成）
- **UIコンポーネント**: Vue 3 (Composition API) — Astro Islandsで必要な部分だけハイドレート
- **スタイリング**: Bootstrap 5.3 (CDN)
- **TypeScript**: strict mode
- **ホスティング**: GitHub Pages（mainへのpushで自動デプロイ）

開発環境の要件は Node.js 22 以上（CIは24を使用）。

## 📁 プロジェクト構造

```text
/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pagesへの自動デプロイ
├── docs/
│   ├── dice-games-design-doc.md # 設計書
│   └── git-workflow.md          # Git運用ワークフロー
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/              # 共通コンポーネント
│   │   │   ├── DiceDisplay.vue      # サイコロ単体表示
│   │   │   └── DiceTray.vue         # サイコロトレイ
│   │   ├── games/               # ゲームコンポーネント
│   │   │   ├── GameHost.vue         # ゲームの動的解決
│   │   │   ├── ZoromeGame.vue
│   │   │   ├── FiftyGame.vue
│   │   │   ├── QuickMathGame.vue
│   │   │   ├── DiceAdventureGame.vue
│   │   │   ├── ChoHanGame.vue
│   │   │   ├── DicePokerGame.vue
│   │   │   └── PigGame.vue
│   │   └── ui/
│   │       └── GameCard.astro   # ゲーム一覧用カード
│   ├── content/
│   │   ├── config.ts            # Content Collections型定義
│   │   └── games/               # ゲーム情報(Markdown)
│   │       ├── zorome-challenge.md
│   │       ├── fifty-game.md
│   │       ├── quick-math.md
│   │       ├── dice-adventure.md
│   │       ├── cho-han.md
│   │       ├── dice-poker.md
│   │       └── pig-game.md
│   ├── layouts/
│   │   ├── BaseLayout.astro     # サイト全体レイアウト
│   │   └── GameLayout.astro     # ゲームページレイアウト
│   ├── lib/
│   │   ├── storage/
│   │   │   └── LocalStorage.ts  # ストレージアダプタ
│   │   └── utils/
│   │       └── dice.ts          # サイコロユーティリティ
│   ├── pages/
│   │   ├── index.astro          # トップページ
│   │   ├── about.astro          # このサイトについて
│   │   └── games/
│   │       ├── index.astro      # ゲーム一覧
│   │       └── [slug].astro     # ゲーム詳細(動的生成)
│   └── types/
│       └── game.ts              # 共通型定義
├── astro.config.mjs
├── tsconfig.json
├── CLAUDE.md                    # プロジェクト実装ガイド
├── LICENSE
└── package.json
```

## 🧞 開発コマンド

| コマンド | 説明 |
| :--- | :--- |
| `npm install` | 依存関係をインストール |
| `npm run dev` | 開発サーバー起動 (`localhost:4321/dice-games-hiroba/`) |
| `npm run build` | 本番用ビルド (`./dist/`) |
| `npm run preview` | ビルドをローカルでプレビュー |

`base` に `/dice-games-hiroba` を設定しているため、開発時もパス付きのURLになります。

## 🎮 実装済みのゲーム

| ゲーム | 難易度 | サイコロ | 概要 |
| :--- | :--- | :--- | :--- |
| [ぞろ目チャレンジ](src/content/games/zorome-challenge.md) | 初級 | 2〜5個 | ぞろ目が出るまでの回数を競う。個数で難易度を選択 |
| [50ゲーム](src/content/games/fifty-game.md) | 中級 | 2個 | 合計を50ぴったりに。超えたらバースト |
| [サイコロ早押し計算](src/content/games/quick-math.md) | 初級 | 2〜15個 | 合計を素早く暗算。タイム計測、キーボードのみで操作可能 |
| [ダイスアドベンチャー](src/content/games/dice-adventure.md) | 中級 | 2個 | クトゥルフ神話TRPG風のD100判定で冒険。HP/SAN管理 |
| [丁半博打](src/content/games/cho-han.md) | 中級 | 2個 | 合計が偶数（丁）か奇数（半）か。資金管理つき |
| [サイコロポーカー](src/content/games/dice-poker.md) | 中級 | 5個 | Yahtzee風。13ラウンドで役を作り分ける |
| [ブタのしっぽ](src/content/games/pig-game.md) | 初級 | 1個 | 1が出たら全没収のチキンレース。目標100点 |

各ゲームの詳しいルールと戦略は、上記Markdownまたは公開サイトの各ページに記載しています。

## 🎨 特徴

### リアルなサイコロ表示

- ドットベースのサイコロコンポーネント (1の目は赤、2-6は黒)
- カジノ風の緑フェルトトレイ
- スムーズな回転アニメーション
- サイコロの個数（1〜15個）に応じてレイアウトとサイズを自動調整

### アクセシビリティ

- aria属性による適切な情報提供
- キーボード操作対応（サイコロのキープ操作も Enter / Space で可能）
- 明るい背景と暗いテキストで視認性確保

### データ管理

記録はLocalStorageに保存します。将来のサーバー連携に備え、`IStorage` インターフェースを
介した抽象レイヤー経由でのみアクセスします。用途に応じて2系統を使い分けます。

- **試行回数型**: 達成までの回数やタイムなど、小さいほど良い記録（`saveRecord` / `getStats`）
- **任意形式**: 得点型や独自の履歴構造（`saveData` / `getData`）

## 📖 詳細ドキュメント

- **実装ガイド**: [`CLAUDE.md`](CLAUDE.md) — アーキテクチャ、ゲーム追加手順、実装ルール
- **設計書**: [`docs/dice-games-design-doc.md`](docs/dice-games-design-doc.md)
- **Git運用ワークフロー**: [`docs/git-workflow.md`](docs/git-workflow.md)

## 🔧 開発方針

詳細は [`CLAUDE.md`](CLAUDE.md) を参照してください。

- TypeScript strictモード厳守
- Vue 3 Composition API統一（他フレームワークは使わない）
- Bootstrap 5のみでスタイリング（カスタムCSSは最小限）
- 段階的実装（1ゲームを完成させてからパターン化）
- サイコロ表示は `DiceTray` コンポーネントを使用

### ゲームを追加するには

1ゲームは **Markdown 1枚 + Vueコンポーネント1枚** の組で構成します。
この2ファイルを置くだけで表示され、ページ側への登録作業はありません。
手順は [`CLAUDE.md`](CLAUDE.md) の「新しいゲームの追加手順」に記載しています。

## 🔀 Git運用ルール

このプロジェクトでは厳格なブランチ管理を実施しています。

### 基本ルール

- ✅ mainブランチへの直接コミット禁止
- ✅ すべての変更は機能ブランチ経由
- ✅ Pull Request必須
- ✅ Conventional Commits形式のコミットメッセージ

### 開発フロー

```bash
# 1. 新しいブランチを作成
git checkout -b feat/feature-name

# 2. 変更を実装してコミット
git add .
git commit -m "feat: implement feature"

# 3. リモートにプッシュ
git push origin feat/feature-name

# 4. Pull Request (PR) を作成
gh pr create --title "タイトル" --body "説明"

# 5. マージ後のクリーンアップ
git checkout main
git pull origin main
git branch -d feat/feature-name
```

mainへのマージで GitHub Actions が走り、GitHub Pages に自動デプロイされます。

詳細は [`docs/git-workflow.md`](docs/git-workflow.md) を参照してください。

## 📝 ライセンス

[MIT License](LICENSE) © 2025 seudon
