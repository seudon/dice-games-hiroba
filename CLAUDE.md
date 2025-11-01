# サイコロゲーム広場 - プロジェクト実装ガイド

## プロジェクト概要

子供から高齢者まで楽しめるサイコロゲーム集のWebサイトを構築します。

### 技術スタック

- **フレームワーク**: Astro 5.x
- **UIコンポーネント**: Vue 3 (Composition API)
- **スタイリング**: Bootstrap 5.3 (CDN)
- **TypeScript**: strict mode

### 設計方針

1. **段階的実装**: 1ゲームを完成させてからパターン化
2. **Vue統一**: フレームワーク混在を避け、Vueに統一
3. **アクセシビリティファースト**: 最初から対応を組み込む
4. **Bootstrap活用**: CDN経由でBootstrap 5.3を使用
5. **将来の拡張性**: サーバー連携を見据えた抽象レイヤー

## コミュニケーションルール

### 必須事項

1. **日本語でやり取りする** - このプロジェクトでは必ず日本語でコミュニケーションを行う
   - すべての説明、質問、回答は日本語で行う
   - コード内のコメントも日本語で記述
   - ドキュメントも日本語で作成

## 重要な実装ルール

### ❌ やってはいけないこと

1. **早すぎる共通化をしない**
   - 1ゲーム目は独立して実装
   - 共通コンポーネントは3ゲーム目以降

2. **Reactや他のフレームワークを使わない**
   - Vueのみを使用

3. **LocalStorageを直接使わない**
   - 必ず`LocalStorageAdapter`を経由

### ✅ 必ず守ること

1. **TypeScript strictモード** - すべての型を明示
2. **アクセシビリティ** - aria属性を適切に使用
3. **レスポンシブデザイン** - 768px以下でモバイル対応
4. **コメント** - 複雑なロジックには日本語コメント
5. **エラーハンドリング** - try-catchで適切にエラー処理
6. **開発サーバー再起動** - ファイル修正後は必ず開発サーバーを再起動する
   - スタイル変更、コンポーネント修正、設定ファイル変更後は特に重要
   - 自動リロードが効かない場合があるため、確実に再起動すること

## Bootstrap 5 スタイリングルール

### 基本方針

- **Bootstrap 5.3をCDNで使用**: カスタムビルド不要
- **カスタムCSSは最小限**: Bootstrapクラスのみで実装
- **厳格な色ルール**: 明るい背景と暗いテキストのみ使用

### 必ず使用するBootstrapコンポーネントクラス

**レイアウト:**
- **コンテナ**: `container`, `container-fluid`
- **グリッド**: `row`, `col`, `col-md-*`
- **Flexbox**: `d-flex`, `justify-content-*`, `align-items-*`
- **スペーシング**: `p-*`, `m-*`, `gap-*`, `mb-*`, `mt-*`

**コンポーネント:**
- **ボタン**: `btn btn-primary`, `btn btn-secondary`, `btn-lg`
- **カード**: `card`, `card-body`, `card-title`
- **ナビゲーション**: `navbar`, `nav`, `nav-link`
- **フォーム**: `form-label`, `form-control`, `form-select`
- **バッジ**: `badge`, `bg-primary`, `bg-secondary`, `bg-success`, `bg-info`, `bg-warning`, `bg-danger`
- **アラート**: `alert`, `alert-info`, `alert-success`, `alert-warning`

### 厳格な色ルール（絶対遵守）

**許可される色クラス:**
- **背景**: `bg-light`, `bg-white` のみ
- **テキスト**: `text-dark` のみ
- **ボタン**: `btn-primary`, `btn-secondary` のみ

**絶対に使用禁止:**
- ❌ `bg-dark`, `bg-black`
- ❌ `text-light`, `text-white` (フッターなど一部例外を除く)
- ❌ その他の暗い色クラス

### カスタムCSS

**カスタムCSSは極力避ける:**
- Bootstrapクラスで実現できる場合は必ずBootstrapを使用
- どうしても必要な場合のみVueコンポーネントの `<style scoped>` に記述
- 例:
  - サイコロコンポーネント (DiceDisplay.vue, DiceTray.vue) - ドットパターン、フェルト質感
  - ゲーム固有のビジュアル要素

### やってはいけないこと（スタイリング）

❌ BootstrapコンポーネントがあるのにカスタムCSSで実装
❌ インラインスタイル（`style="..."`）の使用
❌ `<style>`タグの使用（Vueの`<style scoped>`以外）
❌ 暗い色クラス (`bg-dark`, `text-light`等) の使用
❌ `!important` の使用

## Git管理ワークフロー

### 必ず守るべきルール

このプロジェクトでは厳格なブランチ管理を実施します。

**詳細は [`docs/git-workflow.md`](docs/git-workflow.md) を参照してください。**

#### 1. mainブランチへの直接コミット禁止

- mainブランチには**絶対に**直接プッシュしない
- すべての変更は機能ブランチを経由する

#### 2. 開発フロー

```bash
# 1. 新しいブランチを作成
git checkout -b feat/feature-name  # または fix/bug-name

# 2. 変更を実装してコミット
git add .
git commit -m "feat: implement feature"

# 3. リモートにプッシュ
git push origin feat/feature-name

# 4. Pull Request (PR) を作成
gh pr create --title "タイトル" --body "説明"
# または GitHub Web UIで作成

# 5. PRをレビュー・マージ（GitHub上で実施）

# 6. マージ後のクリーンアップ
git checkout main
git pull origin main
git branch -d feat/feature-name  # ローカルブランチ削除
```

#### 3. コミットメッセージ規約

Conventional Commits形式を使用：

- `feat:` - 新機能追加
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `refactor:` - リファクタリング
- `test:` - テスト追加・修正
- `chore:` - その他の変更

**例:**
```bash
git commit -m "feat: add dice count selection to QuickMathGame"
git commit -m "fix: resolve input focus issue in QuickMathGame"
git commit -m "docs: update CLAUDE.md with Git workflow"
```

#### 4. ブランチ命名規則

- `feat/機能名` - 新機能開発
- `fix/バグ名` - バグ修正
- `docs/ドキュメント名` - ドキュメント更新
- `refactor/対象名` - リファクタリング

### GitHub CLI (gh) の使用

PRをコマンドラインから効率的に作成・管理するために GitHub CLI を使用します。

#### インストール（WSL2/Ubuntu）

```bash
# GitHub公式リポジトリのGPGキーを追加
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg

# リポジトリを追加（アーキテクチャを直接指定）
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list

# インストール
sudo apt update
sudo apt install gh -y

# 認証（初回のみ）
gh auth login
```

#### よく使うコマンド

```bash
# PR作成
gh pr create --title "タイトル" --body "説明"

# PR一覧表示
gh pr list

# PR詳細表示
gh pr view [番号]

# PRをマージ
gh pr merge [番号]

# PRのステータス確認
gh pr status
```

## 実装フェーズ

### Phase 1: プロジェクトセットアップ ✓
- Astroプロジェクト作成
- Vue統合追加
- ディレクトリ構造作成

### Phase 2: 基盤ファイルの作成
- 設定ファイル (astro.config.mjs, tsconfig.json)
- 型定義 (game.ts)
- ユーティリティ (dice.ts, LocalStorage.ts)
- Content Collections設定

### Phase 3: レイアウトコンポーネント
- BaseLayout.astro
- GameLayout.astro

### Phase 4: 最初のゲーム実装（ぞろ目チャレンジ）
- ゲーム情報 (zorome-challenge.md)
- Vueゲームコンポーネント (ZoromeGame.vue)
- 動的ゲームページ ([slug].astro)

### Phase 5: トップページとゲーム一覧
- GameCard.astro
- トップページ (index.astro)
- ゲーム一覧ページ (games/index.astro)

### Phase 6: その他ページ
- aboutページ (about.astro)

### Phase 7: デプロイ設定
- GitHub Actions設定
- astro.config.mjs確認

### Phase 8: 動作確認
- ローカル開発サーバー確認
- ビルド確認
- 全機能テスト

## ファイル作成順序

1. プロジェクトセットアップ
2. `src/types/game.ts`
3. `src/lib/utils/dice.ts`
4. `src/lib/storage/LocalStorage.ts`
5. `src/content/config.ts`
6. `src/layouts/BaseLayout.astro` (Bootstrap CDN統合)
7. `src/layouts/GameLayout.astro`
8. `src/content/games/zorome-challenge.md`
9. `src/components/games/ZoromeGame.vue`
10. `src/pages/games/[slug].astro`
11. `src/components/ui/GameCard.astro`
12. `src/pages/index.astro`
13. `src/pages/games/index.astro`
14. `src/pages/about.astro`
15. `.github/workflows/deploy.yml`
16. 動作確認

## 参考ドキュメント

- **設計書**: [`docs/dice-games-design-doc.md`](docs/dice-games-design-doc.md)
- **Git運用ワークフロー**: [`docs/git-workflow.md`](docs/git-workflow.md)
- **Astro公式**: https://docs.astro.build
- **Vue 3公式**: https://vuejs.org
- **GitHub CLI**: https://cli.github.com/manual/

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 現在の状態

- [x] プロジェクトセットアップ完了 (Astro 5.x + Vue 3)
- [x] 基盤ファイル作成完了
- [x] レイアウトコンポーネント作成完了 (Bootstrap 5 CDN統合)
- [x] ぞろ目チャレンジ実装完了
- [x] 50ゲーム実装完了
- [x] サイコロ早押し計算実装完了
- [x] トップページ作成完了
- [x] about/gamesページ作成完了
- [x] Bootstrap 5への移行完了
- [x] **リアルサイコロコンポーネント実装完了** (DiceDisplay.vue, DiceTray.vue)
- [ ] デプロイ設定 (準備中)

## コンポーネント構成

### 共通コンポーネント (src/components/common/)

**DiceDisplay.vue** - 単体サイコロ表示
- ドットベースの表示（1=赤丸、2-6=黒丸）
- サイズバリエーション: sm (60px), md (80px), lg (100px)
- 回転アニメーション対応
- アクセシビリティ対応 (aria-label)

**DiceTray.vue** - サイコロトレイ
- カジノ風緑フェルト背景
- レスポンシブグリッドレイアウト (1-15個対応)
- モバイル最適化
- フェルト質感の擬似要素効果

### ゲームコンポーネント (src/components/games/)

**ZoromeGame.vue** - ぞろ目チャレンジゲーム
- 新サイコロコンポーネント統合済み
- ゲームロジック、統計記録機能

**FiftyGame.vue** - 50ゲーム
- 累積スコア管理
- バースト判定機能
- 戦略的判断を促すUI

**QuickMathGame.vue** - サイコロ早押し計算
- サイコロ個数選択機能 (2〜15個)
- タイム計測、正解率記録
- キーボードのみで操作可能 (数字キー + Enter)
- 自動フォーカス管理
- 個数別統計記録
