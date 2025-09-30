# 質問設計のためのプロンプト

あなたは心理テストの設計専門家です。外国人に日本の漢字名を提案するWebサービス「YourKanjiName」のための質問フローを設計してください。

## 目的
ユーザーの性格・動機・行動特性を測定し、AIが適切な漢字2文字の日本名を生成するためのデータを収集する。

## 測定すべき要素

### 1. 性別情報
- **申告性別**: male / female / nonbinary / prefer_not_to_say
- **性別特性スコア**: -10（女性的）～ +10（男性的）
  - 男性的特性: リーダーシップ、競争心、論理性、独立性
  - 女性的特性: 共感力、協調性、育む力、美的感覚

### 2. 主要動機（6種類から1つを特定）
1. **知識欲** (knowledge): 学び、理解、真理探究
2. **創造欲** (creative): 創作、表現、革新
3. **所属欲** (belonging): 愛、繋がり、調和
4. **支配欲** (dominance): リーダーシップ、達成、影響力
5. **安定欲** (stability): 平穏、継続、信念
6. **自由欲** (freedom): 独立、冒険、個性

各動機にはさらに3つのサブタイプがあります（例: 知識欲 → 真理探究型、学習成長型、理解共有型）

### 3. 行動特性（3要素）
- **決断力** (decisiveness): -3（優柔不断）～ +3（即断即決）
- **行動力** (action_oriented): -2（慎重派）～ +2（行動派）
- **一貫性** (consistency): -3（ブレやすい）～ +3（ブレない）

## 現在の問題点

既存の質問フローには以下の問題があります：

1. **重複**: 決断力を測る質問が4回も出てくる（Q6, Q7, Q8, Q10）
2. **不適切な質問**: サブタイプ質問（例: 創作関連）がすべての人に出ている
3. **流れが悪い**: 性別特性 → 決断力 → 行動 → 決断力 → 動機 → 決断力 → サブタイプ → 決断力

## 設計要件

### 質問構成（合計12-14問、Q0除く）
1. **Q0**: 導入文（「完全一致しなくてもOK」という説明）
2. **Q1**: 性別宣言（4択）
3. **性別特性質問 3-4問**: 申告性別に応じた質問で性別特性スコアを測定
4. **動機測定質問 5-7問**: 6つの動機それぞれにスコアを付与
5. **サブタイプ質問 2問**: 最高得点の動機に応じた詳細質問
6. **行動特性質問 2-3問**: 決断力、行動力、一貫性を測定

### 質問設計のポイント
- **実際の行動**を聞く（理想ではなく）
- **具体的なシチュエーション**を提示
- **選択肢は4-6個**、中間選択肢も用意
- **回答しやすい**言葉遣い（専門用語を避ける）
- **文化中立的**（日本文化を知らなくても答えられる）

### 避けるべきこと
- 同じテーマの質問を繰り返さない
- 「あなたは〜なタイプですか？」という直接的な聞き方を避ける
- 社会的に望ましい答えが明白な質問を避ける
- 複雑すぎる設定や長文の質問

## 出力形式

以下のJSON形式で質問フローを設計してください：

```json
{
  "meta": {
    "total_questions": 14,
    "description": "質問フローの説明"
  },
  "flow": {
    "Q0": {
      "id": "Q0",
      "type": "introduction",
      "text": {
        "ja": "これからいくつかの質問をします。全ての選択肢があなたにピッタリ当てはまるとは限りませんが、その中で最も近いと感じるものを選んでください。完全に一致しなくても大丈夫です。",
        "en": "We will ask you several questions. Not all options may perfectly match you, but please choose the one that feels closest."
      },
      "next": "Q1"
    },
    "Q1": {
      "id": "Q1",
      "type": "gender_declaration",
      "text": {
        "ja": "性別を教えてください。",
        "en": "Please tell us your gender."
      },
      "options": [
        {"id": "male", "text": {"ja": "男性", "en": "Male"}, "next": "M-1"},
        {"id": "female", "text": {"ja": "女性", "en": "Female"}, "next": "F-1"},
        {"id": "nonbinary", "text": {"ja": "ノンバイナリー/その他", "en": "Non-binary/Other"}, "next": "NB-1"},
        {"id": "prefer_not_to_say", "text": {"ja": "回答したくない", "en": "Prefer not to say"}, "next": "Q2"}
      ]
    }
  }
}
```

### 質問IDの命名規則
- Q0: 導入
- Q1: 性別宣言
- M-1, M-2, M-3, M-4: 男性用の性別特性質問
- F-1, F-2, F-3, F-4: 女性用の性別特性質問
- NB-1, NB-2, NB-3, NB-4: ノンバイナリー用の性別特性質問
- Q2-Q8: 動機測定質問（全員共通）
- Q9-knowledge-A, Q10-knowledge-B: 知識欲のサブタイプ質問
- Q9-creative-A, Q10-creative-B: 創造欲のサブタイプ質問
- Q9-belonging-A, Q10-belonging-B: 所属欲のサブタイプ質問
- Q9-dominance-A, Q10-dominance-B: 支配欲のサブタイプ質問
- Q9-stability-A, Q10-stability-B: 安定欲のサブタイプ質問
- Q9-freedom-A, Q10-freedom-B: 自由欲のサブタイプ質問
- Q11, Q12, Q13: 行動特性質問（決断力、行動力、一貫性）

### スコア付与ルール
- 性別特性質問: `"score": -3 ~ 3` を各選択肢に付与
- 動機測定質問: `"scores": {"knowledge": 2, "creative": 1, ...}` のように複数動機にスコア付与可能
- サブタイプ質問: `"scores": {"truth_seeking": 2, "learning_growth": 1, ...}` のようにサブタイプにスコア付与
- 行動特性質問: `"decisiveness": 2, "action_oriented": 1, "consistency": -1` のようにスコア付与

### フロー制御
- 性別特性質問の最後: `"next": "Q2"` で動機測定質問へ
- Q8の後: `"next": "CALCULATE_HIGHEST_MOTIVATION"` を指定（システムが最高得点の動機を計算してサブタイプ質問へ自動分岐）
- サブタイプ質問B（Q10-*-B）の最後: `"next": "Q11"` で行動特性質問へ
- 最後の質問（Q13）: `"next": "GENERATE_RESULT"`

## サブタイプ一覧

### 知識欲 (knowledge)
- truth_seeking: 真理探究型
- learning_growth: 学習成長型
- understanding_sharing: 理解共有型

### 創造欲 (creative)
- pure_creation: 純粋創作型
- innovation_transformation: 革新変革型
- expression_communication: 表現伝達型

### 所属欲 (belonging)
- pure_love_devotion: 純愛献身型
- harmony_cooperation: 調和協力型
- protection_nurturing: 保護育成型

### 支配欲 (dominance)
- leadership_command: 指導統率型
- competition_victory: 競争勝利型
- influence_change: 影響変化型

### 安定欲 (stability)
- peace_rest: 平穏安息型
- continuity_maintenance: 継続維持型
- deep_rooted_belief: 根深信念型

### 自由欲 (freedom)
- liberation_independence: 解放独立型
- adventure_exploration: 冒険探索型
- individuality_expression: 個性表現型

## 質問例

### 良い質問
- 「先週末、実際に何をして過ごしましたか？」（実際の行動）
- 「レストランでメニューを決める時、あなたは？」（具体的シチュエーション）
- 「10年後、こうなっていたら最高だと思うのは？」（価値観）

### 悪い質問
- 「あなたは論理的な人ですか？」（直接的すぎる）
- 「リーダーシップがありますか？」（社会的望ましさバイアス）

## 重要な注意事項

1. **スムーズな流れ**: 質問のテーマが急に変わらないように
2. **重複を避ける**: 同じことを聞く質問を複数作らない
3. **全員に適用**: 動機測定質問は全員に聞く（特定の動機に偏らない）
4. **サブタイプは分岐**: Q9-*-AとQ10-*-Bは、最高得点の動機に応じて出し分ける
5. **合計12-14問**: Q0を除いて12-14問に収める

完全なJSONファイルを作成してください。すべての質問、選択肢、スコア、フロー制御を含めてください。