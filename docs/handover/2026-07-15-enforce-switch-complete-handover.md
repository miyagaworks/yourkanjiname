# 2026-07-15 引き継ぎノート（2）: 強制モード切替 完了・本番稼働中（M-5 決済ゲート）

<reliability>
ctx 残量: 中〜高（作業完了直後に作成）。
<known-fact> / <verification> は全て Super の直接実測（vercel CLI / 本番APIへのcurl直叩き）
またはユーザーの Neon SQL Editor 実行結果・本番実機確認に基づく。
本セッションはコード変更なし（環境変数追加＋再デプロイのみ）。
前ノート docs/handover/2026-07-15-m4-m5-handover.md の <task>（強制モード切替）を本セッションで完了した。
</reliability>

<context>
前ノート（2026-07-15 m4-m5）からの継続。M-4/M-5 の決済チェックは記録モードで本番稼働していた。
ユーザーが自分のカードで実購入を1回通した（決済→名前→質問→結果表示、問題なし）ため、
その実データで判定・紐付けを確認し、記録モード → 強制モード（enforce）へ切り替えた。
運用形態は従来通り: Super がクエリ/手順を設計 → ユーザーが Neon 実行・実機確認 →
env 変更・再デプロイ・本番検証は Super が直接実行（Vercel CLI・curl）。
</context>

<status>
## 完了（全て本番反映・検証済み）
| 項目 | 実証 |
|---|---|
| 判定分布の健全性確認 | missing=1(テスト行), verified_db=1(実購入), verified_demo=1。rejected_*=0, fail_open_*=0 |
| 実購入の Stripe 判定・紐付け | verified_db / payment_status=succeeded / linked_ok=true |
| 強制モード切替（PAYMENT_CHECK_MODE=enforce） | 本番稼働中。下記 <verification> 参照 |
| 未払い→402拒否（Super） | 本番curlで実証 |
| 正規フロー（デモコード）通過（ユーザー実機） | 結果表示まで通過 |
| テスト購入の返金＋システム側 refunded 反映 | payments.status=refunded を実測 |

## 未着手（監査残項目・優先度低）
- L-1（?preview=result 不動作。修正3案は監査報告書 docs/bug-audit-2026-07-13.md に記載済み）
- L-2, L-3, L-5, L-7（低影響）
</status>

<known-fact>
## 本番状態（2026-07-15 切替後、全て実測）
- git 最新コミットは本引き継ぎノート自身（`docs: 2026-07-15 強制モード切替完了…`）。
  作業ツリークリーン・HEAD=origin/main。**本セッションでのコード変更なし**（コミットはこの引き継ぎノートのみ）
- Vercel 本番 env に `PAYMENT_CHECK_MODE = enforce` を追加（Production スコープ、`vercel env ls` で登録確認済み）
- 再デプロイ: `yourkanjiname-3hz2xliaq-senrigan.vercel.app`（status=Ready）。
  本番エイリアス（kanjiname.jp / app.kanjiname.jp / www.kanjiname.jp）に昇格済み
- 強制モードの拒否ロジック（api/sessions.ts:73-81）: `PAYMENT_CHECK_MODE==='enforce'` かつ
  判定が拒否6コード（missing / rejected_format / rejected_not_found / rejected_not_paid /
  rejected_demo / rejected_skip）のとき 402 `{error:{code:'PAYMENT_REQUIRED'}}` を返す。
  **402リターンは createSession より前（:83）＝拒否時はセッション行を作らない**
- verified系・fail_open系（fail_open_stripe / fail_open_db）は enforce でも通す（fail-open設計）。
  Stripe/DB障害時に正規ユーザーを締め出さないための救済
- 返金webフック（api/stripe/webhook.js:207-217, charge.refunded）: 実購入の返金で
  payments.status を succeeded→refunded に更新することを本番で実証（Stripe側の
  charge.refunded イベント購読も有効と判明）
</known-fact>

<verification>
## 本セッションの実測ログ
1. 判定分布（Neon, branch main, created_at > 2026-07-14 12:40）:
   missing=1 / verified_db=1 / verified_demo=1。rejected_*・fail_open_* ともに 0
2. 実購入の紐付け（Neon）: session 23d4c0ba-cf07-477b-857f-f90860037ae1 /
   pi_3TtI9YLATL9KUSaT00L0kvr1 / verified_db / payment_status=succeeded / linked_ok=true /
   created_at 02:06 UTC(=11:06 JST、ユーザー申告「11時頃」と一致)
   → 前ノートで「未実証」だった Stripe実決済系統(verified_db)が端から端まで動くことを証明
3. 未払い→402（Super, 本番 app.kanjiname.jp への curl POST /api/sessions、payment_intent_id なし）:
   `{"error":{"code":"PAYMENT_REQUIRED","message":"Payment verification failed"}}` / HTTP 402
4. 正規フロー（ユーザー実機, デモコード）: 名前→16問→結果表示まで通過（402やエラー画面なし）
5. 返金（ユーザーが Stripe Dashboard で全額返金 → Neon で実測）:
   payments.status=refunded / session_id=23d4c0ba-...(保持) / updated_at 03:00:30 UTC(=12:00 JST)
</verification>

<risk level="operational">
## 緊急ロールバック手順（記録モードへ即戻す）
強制モードで正規ユーザーが誤って402で弾かれる事象が出た場合:
1. `vercel env rm PAYMENT_CHECK_MODE production`（または値を enforce 以外に変更）
2. `vercel --prod --yes` で再デプロイ → 記録モードに復帰（どの判定でも201で通す）
※ 監視観点: Vercel Functions のログで `[sessions] payment_verification=rejected_*` や
  予期しない402が正規ユーザーに出ていないか。fail_open_* の頻発は Stripe/DB 障害の兆候。
</risk>

<handover>
## バックログ（優先度低・記録のみ。前ノート群から継続）
1. deployされる api/*.ts はローカルのどの build スクリプトからも型チェックされていない
   （root tsconfig は api/ を含まない）。恒久対応は tsconfig 整備の別タスク
2. paymentRequiredError の9言語訳はネイティブ未検証（既存36キーと同じ扱い）
3. デモコードの文字列を知る者は使用回数を消費せずセッションを作れる残存経路あり
   （設計時に許容判断済み。完全対策は一回限りトークン発行で別タスク）
4. 最終質問リトライで failed リストが2回目以降失われる（App.js 973-980 付近、既知。リロードで復旧可）
5. 背景送信待機中（最大5秒）の言語切替で回答送信の lang が回答時点のまま（実害ほぼなし）
6. 前ノート（2026-07-14 / 2026-07-15 m4-m5）のバックログも未処理のまま有効
</handover>

<next-action>
次セッションの Super が最初にやること:
1. このノートを Read（前ノート 2026-07-15-m4-m5 の <task> は本ノートで完了済み）
2. git status / git log --oneline -3 で確認（作業ツリークリーン。最新コミットはこの引き継ぎノートの
   docs コミット、その親が前ノート `875abe1`。決済ゲート関連のコード変更はなし）
3. 強制モードは本番稼働中。新規タスクがなければ監査残項目（L-1 等）か上記バックログから
</next-action>

<reflection>
- 決済ロジックの最終段階（記録→強制）を、切替前に本番実データで健全性（分布0拒否・実購入の
  judged+linked）を実測してから倒せた。「本番データ依存の修正は事前 READ-ONLY 実測で現状確定」原則が有効に働いた
- 切替の成否は「本番ドメインへの curl で402」というグラウンドトゥルースで確定した。
  env登録やデプロイReadyの表示を成功の証拠にせず、実挙動で裏取りした
- 実購入・デモ・未払いの3系統を、Super(curl)とユーザー(実機/Neon)で分担し1メッセージ内で
  手順を番号付き提示 → 前ノートで反省した「往復増加」を回避できた
</reflection>
</content>
</invoke>
