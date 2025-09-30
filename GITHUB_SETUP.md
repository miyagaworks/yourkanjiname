# GitHub リポジトリセットアップ手順

## 1. GitHubでリポジトリ作成

### 1.1 ブラウザでGitHubにアクセス

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック

### 1.2 リポジトリ情報を入力

**Repository name**: `yourkanjiname`

**Description**:
```
AI-powered Japanese Kanji name generator based on psychological profiling
```

**Visibility**:
- [ ] Public (推奨: オープンソース)
- [x] Private (非公開にする場合)

**Initialize this repository with**:
- [ ] Add a README file (チェックしない - 既にREADME.mdがある)
- [ ] Add .gitignore (チェックしない - 既に.gitignoreがある)
- [ ] Choose a license (後で追加可能)

「Create repository」をクリック

---

## 2. ローカルリポジトリをGitHubにプッシュ

### 2.1 リモートリポジトリを追加

GitHubが表示する「...or push an existing repository from the command line」のコマンドを実行:

```bash
git remote add origin https://github.com/[your-username]/yourkanjiname.git
git branch -M main
git push -u origin main
```

または SSH を使用する場合:

```bash
git remote add origin git@github.com:[your-username]/yourkanjiname.git
git branch -M main
git push -u origin main
```

### 2.2 プッシュ実行

以下のコマンドをターミナルで実行してください:

```bash
# HTTPSの場合
git remote add origin https://github.com/[your-username]/yourkanjiname.git
git push -u origin main

# SSHの場合
git remote add origin git@github.com:[your-username]/yourkanjiname.git
git push -u origin main
```

**注意**: `[your-username]` を実際のGitHubユーザー名に置き換えてください

---

## 3. GitHub認証

### 3.1 HTTPSを使用する場合

初回プッシュ時に認証が求められます:

**macOS**: Keychainに保存された認証情報が使用されます
**Personal Access Token**が必要な場合:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" をクリック
3. Note: `YourKanjiName Deploy`
4. Expiration: `90 days` または `No expiration`
5. Select scopes:
   - [x] repo (全てにチェック)
6. "Generate token"をクリック
7. トークンをコピーしてパスワードとして使用

### 3.2 SSHを使用する場合

SSH鍵を設定済みの場合はそのまま使用できます。
未設定の場合:

```bash
# SSH鍵生成
ssh-keygen -t ed25519 -C "your_email@example.com"

# SSH agentに追加
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 公開鍵をコピー
cat ~/.ssh/id_ed25519.pub
```

GitHubで公開鍵を登録:
1. GitHub → Settings → SSH and GPG keys
2. "New SSH key"をクリック
3. Title: `MacBook Pro` など
4. Key: 公開鍵の内容をペースト
5. "Add SSH key"をクリック

---

## 4. プッシュ確認コマンド

```bash
cd /Users/miyagawakiyomi/Projects/kanjiname

# リモートリポジトリ確認
git remote -v

# ステータス確認
git status

# ブランチ確認
git branch -a
```

---

## 5. トラブルシューティング

### エラー: "remote origin already exists"

```bash
# 既存のリモートを削除
git remote remove origin

# 再度追加
git remote add origin https://github.com/[your-username]/yourkanjiname.git
```

### エラー: "Authentication failed"

HTTPSの場合、Personal Access Tokenを使用してください（手順3.1参照）

### エラー: "Permission denied (publickey)"

SSH鍵が正しく設定されていません（手順3.2参照）

---

## 6. 完了確認

プッシュが成功したら、ブラウザでGitHubリポジトリを確認:

```
https://github.com/[your-username]/yourkanjiname
```

以下が表示されていればOK:
- [x] 80 files
- [x] README.md が表示されている
- [x] フォルダ構成が正しい (frontend/, src/, doc/ など)
- [x] 最新コミット: "Initial commit: YourKanjiName v2.0"

---

**次のステップ**: DEPLOYMENT.md を参照してVercelデプロイを進めてください