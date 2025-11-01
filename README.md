# サイコロゲーム広場

子供から高齢者まで楽しめるサイコロゲーム集のWebサイト

**🌐 公開サイト**: https://seudon.github.io/dice-games-hiroba/

ブラウザ上でサイコロゲームを楽しめます。実際のサイコロがなくても、すぐに遊べます！

## 🎲 プロジェクト概要

様々なサイコロゲームのルール、記録表、ブラウザゲームを提供するWebサイトです。
実際のサイコロで遊ぶのが一番楽しいですが、サイコロがない時でもブラウザ上で遊ぶことができます。

## 🚀 技術スタック

- **フレームワーク**: Astro 5.x
- **UIコンポーネント**: Vue 3 (Composition API)
- **スタイリング**: Bootstrap 5.3 (CDN)
- **TypeScript**: strict mode
- **ホスティング**: GitHub Pages

## 📁 プロジェクト構造

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/          # 共通コンポーネント
│   │   │   ├── DiceDisplay.vue  # サイコロ単体表示
│   │   │   └── DiceTray.vue     # サイコロトレイ
│   │   ├── games/           # ゲームコンポーネント
│   │   │   └── ZoromeGame.vue
│   │   └── ui/              # UIコンポーネント
│   │       └── GameCard.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── games/           # ゲーム情報
│   │       └── zorome-challenge.md
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── GameLayout.astro
│   ├── lib/
│   │   ├── storage/
│   │   │   └── LocalStorage.ts
│   │   └── utils/
│   │       └── dice.ts
│   ├── pages/
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── games/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   └── types/
│       └── game.ts
├── astro.config.mjs
├── tsconfig.json
├── CLAUDE.md               # プロジェクト実装ガイド
└── package.json
```

## 🧞 開発コマンド

| コマンド | 説明 |
| :--- | :--- |
| `npm install` | 依存関係をインストール |
| `npm run dev` | 開発サーバー起動 (`localhost:4321`) |
| `npm run build` | 本番用ビルド (`./dist/`) |
| `npm run preview` | ビルドをローカルでプレビュー |

## 🎮 実装済みのゲーム

### ぞろ目チャレンジ
- サイコロでぞろ目を出すまでの回数を競うシンプルなゲーム
- 難易度: 初級〜超級 (サイコロ2〜5個)
- 統計記録機能付き

### 50ゲーム
- サイコロを振って合計を50ぴったりに近づける戦略的ゲーム
- 難易度: 中級
- 累積スコア管理と戦略的判断が必要

### サイコロ早押し計算
- サイコロの合計を素早く計算して答えるスピード計算ゲーム
- 難易度: 初級（サイコロ2〜15個から選択可能）
- タイム計測、正解率記録、キーボードのみで操作可能
- 暗算力と反射神経を鍛える教育的ゲーム

## 🎨 特徴

### リアルなサイコロ表示
- ドットベースのサイコロコンポーネント (1の目は赤、2-6は黒)
- カジノ風の緑フェルトトレイ
- スムーズな回転アニメーション
- レスポンシブデザイン対応

### アクセシビリティ
- aria属性による適切な情報提供
- キーボード操作対応
- 明るい背景と暗いテキストで視認性確保

### データ管理
- LocalStorageでゲーム記録を保存
- 抽象化されたストレージレイヤー（将来のサーバー連携に備える）

## 📖 詳細ドキュメント

- **実装ガイド**: [`CLAUDE.md`](CLAUDE.md)
- **設計書**: [`docs/dice-games-design-doc.md`](docs/dice-games-design-doc.md)
- **Git運用ワークフロー**: [`docs/git-workflow.md`](docs/git-workflow.md)

## 🔧 開発方針

詳細は `CLAUDE.md` を参照してください。

- TypeScript strictモード厳守
- Vue 3 Composition API統一
- Bootstrap 5のみでスタイリング（カスタムCSSは最小限）
- 段階的実装（1ゲームを完成させてからパターン化）

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

詳細は [`docs/git-workflow.md`](docs/git-workflow.md) を参照してください。

## 📝 ライセンス

© 2025 サイコロゲーム広場
