# 開発環境セットアップガイド

## 必要条件

### 必要なソフトウェア
- Node.js (v18.0.0以上)
- Python (v3.10以上)
- Git
- Docker (推奨)
- Visual Studio Code (推奨)

### システム要件
- メモリ: 最小8GB、推奨16GB
- ストレージ: 最小1GB以上の空き容量
- OS: MacBook Air macOS14.7.1

## 初期セットアップ

### 1. リポジトリのセットアップ
```bash
# リポジトリのクローン
git clone https://github.com/your-org/my-kanji-name.git
cd my-kanji-name

# 開発用ブランチの作成
git checkout -b development
```

### 2. フロントエンドのセットアップ
```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存パッケージのインストール
npm install

# 環境設定ファイルの作成
cp .env.example .env

# 開発サーバーの起動
npm run dev
```

### 3. バックエンドのセットアップ
```bash
# バックエンドディレクトリに移動
cd backend

# 仮想環境の作成と有効化
python -m venv venv
source venv/bin/activate  # Windowsの場合: .\venv\Scripts\activate

# 依存パッケージのインストール
pip install -r requirements.txt

# データベースの初期化
python scripts/init_db.py

# 開発サーバーの起動
python run.py
```

### 4. データのセットアップ
```bash
# 漢字データベースの初期化
python scripts/init_kanji_data.py

```

## 開発用データベースのセットアップ

### ローカルデータベース
```bash
# SQLiteデータベースの作成
python scripts/create_db.py

# マイグレーションの実行
python scripts/migrate.py

# 初期データの投入
python scripts/seed_data.py
```

### Docker環境のデータベース（オプション）
```bash
# データベースコンテナの起動
docker-compose up -d db

# マイグレーションの実行
docker-compose exec backend python scripts/migrate.py
```

## 環境設定

### フロントエンド (.env)
```plaintext
VITE_API_URL=http://localhost:8000/api/v1
VITE_AUDIO_PATH=/audio
VITE_DEBUG_MODE=true
```

### バックエンド (.env)
```plaintext
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
CORS_ORIGINS=http://localhost:3000
```

## 動作確認手順

1. 全てのサービスを起動:
```bash
# ターミナル1 (フロントエンド)
cd frontend && npm run dev

# ターミナル2 (バックエンド)
cd backend && python run.py
```

2. セットアップの確認:
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000/api/v1/system/health
- ドキュメント: http://localhost:8000/docs

## よくある問題と解決方法

### フロントエンドの問題
1. **Node modulesのエラー**
   ```bash
   rm -rf node_modules
   npm clean-cache
   npm install
   ```

2. **環境変数が読み込まれない**
   - .envファイルの存在確認
   - 開発サーバーの再起動

### バックエンドの問題
1. **データベースのマイグレーションエラー**
   ```bash
   rm db.sqlite3
   python scripts/migrate.py
   python scripts/seed_data.py
   ```

2. **パッケージの競合**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

## 参考リソース
- プロジェクトドキュメント: /docs
- API仕様書: /docs/api
- アーキテクチャ概要: /docs/architecture