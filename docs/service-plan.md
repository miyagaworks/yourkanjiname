# MyKanjiName Premium Service 実装計画書

## 1. システム拡張概要

### 1.1 追加機能
- Stripeによる決済システム統合
- ユーザー管理システム
- メール送信システム
- 書道家向け管理画面
- 作品データ管理システム

### 1.2 新規フロー
1. 言語選択
2. 料金表示・決済（$10）
3. ユーザー登録
4. 性格診断
5. 漢字名生成
6. メールアドレス確認
7. 自動メール送信（ユーザー・運営者）
8. 書道家による制作
9. 作品データアップロード
10. 完成通知メール送信

## 2. 実装フェーズ

### Phase 1: 基本インフラ整備（4週間）
- ユーザー管理システムの実装
  - Auth0による認証システム統合
  - ユーザープロファイルDB設計
  - セッション管理の実装
- Stripe決済システムの統合
  - 決済フロー実装
  - webhook処理の実装
  - 決済履歴管理

### Phase 2: メール配信システム（3週間）
- Amazon SESの導入
- メールテンプレート作成（多言語対応）
  - ユーザー向け自動返信
  - 運営者向け通知
  - 完成通知
- メール送信キュー管理
- 送信ログ管理

### Phase 3: 管理システム（3週間）
- 書道家向け管理画面
  - 注文一覧表示
  - 作品アップロード機能
  - ステータス管理
- 運営者向け管理画面
  - ユーザー管理
  - 注文管理
  - 売上レポート

### Phase 4: ストレージと配信（2週間）
- S3による作品データ管理
- CloudFrontによる配信設定
- セキュアなダウンロード機能

## 3. 技術スタック拡張

### 3.1 追加サービス
- 認証: Auth0
- 決済: Stripe
- メール: Amazon SES
- ストレージ: Amazon S3
- 配信: CloudFront
- DB: PostgreSQL (ユーザー/注文管理)

### 3.2 セキュリティ強化
- PCI DSS対応
- 個人情報保護対策
- アクセス制御の厳格化

## 4. データベース拡張

### 4.1 Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL,
  payment_id VARCHAR(255),
  kanji_name VARCHAR(10) NOT NULL,
  artwork_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 4.3 Payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  stripe_payment_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 5. メール通知設計

### 5.1 ユーザー向けメール（多言語対応）
- 注文確認メール
- 作品完成通知メール
- ダウンロード案内メール

### 5.2 運営者向けメール
- 新規注文通知
- 支払い完了通知
- エラー通知

### 5.3 書道家向けメール
- 新規依頼通知
- リマインダー通知

## 6. 管理画面機能

### 6.1 書道家向け
- 未完了注文一覧
- 作品アップロード
- 制作履歴管理

### 6.2 運営者向け
- ユーザー管理
- 注文管理
- 売上レポート
- システム設定

## 7. セキュリティ対策

### 7.1 個人情報保護
- データ暗号化
- アクセス制御
- ログ管理

### 7.2 決済セキュリティ
- PCI DSS準拠
- トークン化
- 監査ログ

## 8. 運用体制

### 8.1 サポート体制
- メール問い合わせ対応
- エラー通知監視
- システム稼働監視

### 8.2 バックアップ体制
- データベースバックアップ
- 作品データバックアップ
- システムログバックアップ

## 9. 今後の展開案

### 9.1 機能拡張
- 複数の書道家対応
- 書体選択オプション
- フレーム選択オプション
- 実物商品の配送対応

### 9.2 マーケティング施策
- SNS連携強化
- アフィリエイトプログラム
- リピーター割引制度
- 紹介プログラム