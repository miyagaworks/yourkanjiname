# Docker開発環境セットアップ

## 使用方法

### 1. 環境変数ファイルの作成

`.env.docker`ファイルを作成（既にテンプレートあり）:

```bash
cp .env.docker.example .env.docker
```

`.env.docker`を編集してパスワードを設定:

```env
DB_NAME=yourkanjiname
DB_USER=postgres
DB_PASSWORD=your_secure_password_here  # ← 変更してください
FRONTEND_URL=http://localhost:3001
```

### 2. Docker Composeで起動

```bash
# 環境変数を読み込んで起動
docker-compose --env-file .env.docker up -d

# または環境変数なしでデフォルト値を使用
docker-compose up -d
```

### 3. 停止・削除

```bash
# 停止
docker-compose down

# データも削除
docker-compose down -v
```

## セキュリティに関する注意

- `.env.docker`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- 本番環境では必ず強力なパスワードを使用してください
- docker-compose.ymlには環境変数またはデフォルト値のみが記載されています