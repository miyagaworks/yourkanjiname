# YourKanjiNaame プロジェクト構造

tree -I 'node_modules|.git|.next|dist|build'
tree -L 3 -I '__pycache__|*.pyc|.git|.env|venv'

## 最初の言語
1. 英語
2. フランス語
3. タイ語
4. ベトナム語

## 将来的な拡張候補：
5. インドネシア語
6. スペイン語（メキシコ、スペイン）
7. ドイツ語

```
YourKanjiNaame/
frontend/
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
│   ├── images
│   │   └── washi.png
│   └── vite.svg
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── KanjiDisplay.tsx
│   │   ├── Layout
│   │   │   └── MainLayout.tsx
│   │   ├── admin
│   │   │   ├── CacheControl.tsx
│   │   │   └── ExplanationTester.tsx
│   │   ├── common
│   │   │   ├── Error
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── ErrorMessage.tsx
│   │   │   ├── Loading
│   │   │   │   └── Loading.tsx
│   │   │   └── Notifications
│   │   │       ├── NotificationContainer.tsx
│   │   │       ├── NotificationContext.tsx
│   │   │       └── Toast.tsx
│   │   ├── forms
│   │   │   └── PersonalityTest
│   │   │       └── QuestionCard.tsx
│   │   ├── guards
│   │   │   └── RouteGuard.tsx
│   │   ├── results
│   │   │   ├── KanjiResult.tsx
│   │   │   └── __tests__
│   │   │       └── KanjiResult.test.tsx
│   │   └── ui
│   │       ├── alert.tsx
│   │       ├── button-variants.ts
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── input.tsx
│   ├── context
│   │   └── PersonalityContext
│   │       ├── context.tsx
│   │       ├── hooks.ts
│   │       ├── index.ts
│   │       ├── provider.tsx
│   │       ├── reducer.ts
│   │       └── types.ts
│   ├── data
│   │   ├── kanjiDatabase.ts
│   │   ├── personalityTraits.ts
│   │   ├── questionFlow.ts
│   │   ├── questions.ts
│   │   └── test.md
│   ├── hooks
│   │   ├── useCache.ts
│   │   ├── useCacheState.ts
│   │   ├── useKanjiNameGeneration.ts
│   │   ├── usePersonality.ts
│   │   └── useValidation.ts
│   ├── i18n
│   │   ├── config.ts
│   │   ├── locales
│   │   │   ├── en.ts
│   │   │   ├── fr.ts
│   │   │   ├── ja.ts
│   │   │   ├── th.ts
│   │   │   └── vi.ts
│   │   └── types.ts
│   ├── index.css
│   ├── lib
│   │   └── utils.ts
│   ├── main.tsx
│   ├── pages
│   │   ├── Home.tsx
│   │   ├── LanguageSelect.tsx
│   │   ├── PersonalityTestPage.tsx
│   │   └── ResultPage.tsx
│   ├── services
│   │   ├── ExplanationService.ts
│   │   ├── api
│   │   │   ├── client.ts
│   │   │   ├── index.ts
│   │   │   └── personalityService.ts
│   │   ├── cache
│   │   │   ├── CacheFactory.ts
│   │   │   ├── CacheService.ts
│   │   │   └── __tests__
│   │   │       └── CacheService.test.ts
│   │   ├── generators
│   │   │   ├── EnglishExplanationGenerator.ts
│   │   │   ├── FrenchExplanationGenerator.ts
│   │   │   ├── JapaneseExplanationGenerator.ts
│   │   │   ├── ThaiExplanationGenerator.ts
│   │   │   ├── VietnameseExplanationGenerator.ts
│   │   │   ├── mocks
│   │   │   │   └── englishTemplates.mock.ts
│   │   │   └── templates
│   │   │       └── english.ts
│   │   ├── kanjiMatching
│   │   │   ├── KanjiMatcher.ts
│   │   │   ├── KanjiNameService.ts
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   ├── logging
│   │   │   └── errorLogging.ts
│   │   ├── personalityAnalyzer.test.ts
│   │   └── personalityAnalyzer.ts
│   ├── styles
│   │   └── loading-animation.css
│   ├── test
│   │   ├── EnglishExplanationGenerator.test.ts
│   │   ├── evaluators
│   │   │   └── MultilingualPatternEvaluator.ts
│   │   ├── generators
│   │   │   └── TestCaseGenerator.ts
│   │   ├── runExplanationTests.ts
│   │   ├── runMultilingualTests.ts
│   │   ├── runners
│   │   │   ├── ExplanationTestRunner.ts
│   │   │   └── MultilingualPatternTestRunner.ts
│   │   ├── setup.ts
│   │   └── types
│   │       └── testTypes.ts
│   ├── types
│   │   ├── errors.ts
│   │   ├── explanation.ts
│   │   ├── kanji.ts
│   │   ├── multilingual.ts
│   │   ├── personality.ts
│   │   ├── results.ts
│   │   ├── typekit.d.ts
│   │   └── validation.ts
│   ├── utils
│   │   ├── test
│   │   │   └── kanjiSelectionTest.ts
│   │   └── validation
│   │       ├── index.ts
│   │       └── rules.ts
│   └── vite-env.d.ts
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
├── backend/
├── app
│   ├── api
│   │   └── routes
│   ├── core
│   │   └── name_generator
│   ├── models
│   │   └── personality
│   ├── services
│   │   └── session
│   └── utils
├── data
│   ├── kanji
│   │   └── kanji_database.json
│   ├── personality
│   │   └── question_traits.json
│   └── rules
│       └── selection_rules.json
├── main.py
├── requirements.txt
└── tests
    ├── api
    │   └── test_name_routes.py
    ├── models
    │   └── test_personality_profile.py
    ├── services
    │   └── test_session_manager.py
    └── unit
        └── test_name_generator.py

└── docs/                # ドキュメント
    ├── api/
    │   ├── endpoints.md
    │   └── schemas.md
    ├── architecture/
    │   ├── system-design.md
    │   └── data-flow.md
    ├── development/
    │   ├── setup.md
    │   └── guidelines.md
    ├── personality/     # 性格診断設計
    ├── matching/        # マッチング設計
    └── operations/
        ├── deployment.md
        └── monitoring.md
```

## 主要コンポーネントの説明

### 1. フロントエンド主要機能
- Session管理
- エラーハンドリング
- 段階的UI表示
- 性格診断システム
- パフォーマンスモニタリング

### 2. バックエンド主要機能
- APIルーティング
- 性格分析処理
- 漢字選定処理
- セッション管理
- キャッシュ制御
- エラー処理
- ログ管理
- 性能最適化

### 3. データ管理
- 漢字データベース
- 性格特性データ
- ルール管理
- キャッシュ制御
- バックアップ

### 4. モニタリング
- ログ収集
- メトリクス計測
- アラート設定
- 性能分析

### 5. ドキュメント
- API仕様
- アーキテクチャ設計
- 開発ガイドライン
- 性格診断システム設計
- マッチングシステム設計
- 運用手順

このプロジェクト構造は、性格診断を中心としたマッチングシステム出力機能を重視した設計となっています。各コンポーネントは独立性を保ちながら、必要に応じて連携できる構造となっています。