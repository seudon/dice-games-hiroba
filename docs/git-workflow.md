# Git運用ワークフロー

## 概要

このプロジェクトでは、コード品質と開発の透明性を保つため、厳格なGit運用ルールを採用しています。

## 基本原則

### 1. mainブランチの保護

- ✅ mainブランチには**絶対に**直接コミット・プッシュしない
- ✅ すべての変更は機能ブランチを経由する
- ✅ Pull Request (PR) によるマージのみ許可
- ✅ PRはレビュー後にマージ

### 2. ブランチ戦略

このプロジェクトでは**Feature Branch Workflow**を採用しています。

```
main (保護されたブランチ)
 │
 ├── feat/new-game          # 新機能開発
 ├── fix/input-focus        # バグ修正
 ├── docs/update-readme     # ドキュメント更新
 └── refactor/dice-logic    # リファクタリング
```

## 開発フロー

### 1. 新しいブランチを作成

```bash
# mainブランチを最新化
git checkout main
git pull origin main

# 新しいブランチを作成
git checkout -b feat/feature-name
```

### 2. 開発とコミット

```bash
# 変更をステージング
git add .

# コミット（Conventional Commits形式）
git commit -m "feat: add dice count selection feature"
```

### 3. リモートにプッシュ

```bash
# 初回プッシュ時
git push -u origin feat/feature-name

# 2回目以降
git push origin feat/feature-name
```

### 4. Pull Request (PR) を作成

#### GitHub CLI を使用する場合（推奨）

```bash
gh pr create --title "新機能: サイコロ個数選択機能" --body "サイコロの個数を2〜15個から選択できる機能を追加しました。"
```

#### GitHub Web UI を使用する場合

1. https://github.com/seudon/dice-games-hiroba を開く
2. "Pull requests" タブをクリック
3. "New pull request" をクリック
4. ブランチを選択してPRを作成

### 5. マージ後のクリーンアップ

```bash
# mainブランチに切り替え
git checkout main

# リモートから最新を取得
git pull origin main

# マージ済みブランチを削除
git branch -d feat/feature-name

# リモートブランチも削除されたか確認
git branch -a
```

## コミットメッセージ規約

### Conventional Commits形式

このプロジェクトでは[Conventional Commits](https://www.conventionalcommits.org/)形式を使用します。

#### 基本フォーマット

```
<type>: <subject>

<body>（オプション）

<footer>（オプション）
```

#### Type（必須）

| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能追加 | `feat: add QuickMathGame component` |
| `fix` | バグ修正 | `fix: resolve input focus issue in QuickMathGame` |
| `docs` | ドキュメント変更 | `docs: update README with Git workflow` |
| `refactor` | リファクタリング | `refactor: extract dice logic to utility` |
| `test` | テスト追加・修正 | `test: add unit tests for dice utilities` |
| `chore` | その他の変更 | `chore: update dependencies` |
| `style` | コードスタイル変更 | `style: format code with prettier` |
| `perf` | パフォーマンス改善 | `perf: optimize dice animation rendering` |

#### Subject（必須）

- **英語で記述**する
- 小文字で始める
- 現在形を使用（"add"、"fix"、"update"など）
- 末尾にピリオドを付けない
- 50文字以内を目安

#### 良い例

```bash
git commit -m "feat: add dice count selection to QuickMathGame"
git commit -m "fix: resolve auto-focus issue on answer input"
git commit -m "docs: add Git workflow documentation"
git commit -m "refactor: extract storage logic to adapter pattern"
```

#### 悪い例

```bash
git commit -m "update"  # ❌ 何を更新したか不明
git commit -m "Fix bug"  # ❌ typeの後にコロンがない、Fixは大文字
git commit -m "新しいゲームを追加"  # ❌ 日本語で記述
git commit -m "feat: Add new game."  # ❌ 大文字で始まっている、ピリオドがある
```

## ブランチ命名規則

### フォーマット

```
<type>/<short-description>
```

### Type

| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能開発 | `feat/dice-count-selection` |
| `fix` | バグ修正 | `fix/input-focus-issue` |
| `docs` | ドキュメント更新 | `docs/git-workflow` |
| `refactor` | リファクタリング | `refactor/storage-layer` |
| `test` | テスト追加 | `test/dice-utilities` |
| `chore` | その他 | `chore/update-dependencies` |

### 命名のガイドライン

- **小文字とハイフン**を使用（`kebab-case`）
- **短く、説明的**に（30文字以内を目安）
- **英語で記述**する

### 良い例

```bash
feat/quick-math-game
fix/dice-animation-timing
docs/update-readme
refactor/dice-display-component
```

### 悪い例

```bash
feat/NewGame  # ❌ キャメルケース
fix_bug  # ❌ アンダースコア
新機能  # ❌ 日本語
feature-branch  # ❌ 具体性がない
```

## GitHub CLI (gh) の活用

### インストール（WSL2/Ubuntu）

```bash
# GitHub公式リポジトリのGPGキーを追加
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg

# リポジトリを追加
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list

# インストール
sudo apt update
sudo apt install gh -y

# 認証（初回のみ）
gh auth login
```

### よく使うコマンド

#### PR作成

```bash
# 基本的なPR作成
gh pr create --title "タイトル" --body "説明"

# 対話的にPR作成
gh pr create
```

#### PR管理

```bash
# PR一覧表示
gh pr list

# 特定のPR表示
gh pr view [番号]

# PRのステータス確認
gh pr status

# PRをマージ
gh pr merge [番号]

# PRをWebブラウザで開く
gh pr view --web
```

#### その他の便利なコマンド

```bash
# リポジトリ情報を表示
gh repo view

# イシュー一覧
gh issue list

# イシュー作成
gh issue create
```

## トラブルシューティング

### プッシュが拒否される場合

```bash
# エラー例
! [remote rejected] main -> main (protected branch hook declined)
```

**原因**: mainブランチに直接プッシュしようとしている

**解決策**:
1. 機能ブランチを作成
2. そのブランチにコミット
3. PRを作成してマージ

### マージコンフリクトが発生した場合

```bash
# mainブランチの最新を取得
git checkout main
git pull origin main

# 機能ブランチに切り替えてマージ
git checkout feat/your-branch
git merge main

# コンフリクトを解決後
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feat/your-branch
```

### 誤ってmainに直接コミットした場合

```bash
# 最新のコミットを取り消す（コミット前の状態に戻る）
git reset --soft HEAD^

# 新しいブランチを作成
git checkout -b feat/correct-branch

# コミット
git add .
git commit -m "feat: correct commit message"

# プッシュ
git push origin feat/correct-branch
```

## ベストプラクティス

### コミットの粒度

- ✅ **小さく、頻繁に**コミットする
- ✅ 1つのコミットは**1つの論理的な変更**のみ
- ✅ ビルドが通る状態でコミット
- ❌ 複数の機能を1つのコミットにまとめない

### PR作成のタイミング

- ✅ 機能が完成したらすぐにPRを作成
- ✅ レビューを受けやすい適度なサイズ（300行以内が目安）
- ✅ 大きな機能は複数のPRに分割

### ブランチのライフサイクル

- ✅ 短命であること（1〜3日以内）
- ✅ マージ後は速やかに削除
- ✅ 定期的にmainからマージして最新化

## Git設定

### プロジェクト固有の設定

```bash
# ユーザー名とメールアドレス（プロジェクトローカル）
git config --local user.name "seudon"
git config --local user.email "4442495+seudon@users.noreply.github.com"
```

### 推奨される全体設定

```bash
# デフォルトブランチ名
git config --global init.defaultBranch main

# コミットエディタ
git config --global core.editor "vim"

# カラフルな出力
git config --global color.ui auto
```

## 参考資料

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Git Book（日本語版）](https://git-scm.com/book/ja/v2)
- [Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials)

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [CLAUDE.md](../CLAUDE.md) - 実装ガイド
- [dice-games-design-doc.md](./dice-games-design-doc.md) - 設計書
