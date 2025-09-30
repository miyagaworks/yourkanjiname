/**
 * YourKanjiName - Frontend Question Flow
 * React + TypeScript実装例
 */

import React, { useState, useEffect } from 'react';

// ===================================
// 型定義
// ===================================

interface QuestionOption {
  id: string;
  text: {
    ja: string;
    en: string;
  };
}

interface Question {
  id: string;
  type: string;
  text: {
    ja: string;
    en: string;
  };
  options: QuestionOption[];
}

interface Progress {
  current_step: number;
  total_steps: number;
  percentage: number;
}

interface ApiResponse {
  question: Question;
  progress: Progress;
}

interface KanjiResult {
  kanji_name: string;
  first_kanji: {
    char: string;
    meaning_en: string;
    meaning_ja: string;
    pronunciation_on: string[];
    pronunciation_kun: string[];
  };
  second_kanji: {
    char: string;
    meaning_en: string;
    meaning_ja: string;
    pronunciation_on: string[];
    pronunciation_kun: string[];
  };
  explanation: {
    ja: string;
    en: string;
  };
  matching_scores: {
    total: number;
    gender_match: number;
    motivation_match: number;
    subtype_match: number;
  };
  pronunciation: {
    romaji: string;
    hiragana: string;
  };
}

// ===================================
// API Client
// ===================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiClient {
  static async createSession(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.session_id;
  }

  static async getNextQuestion(sessionId: string, lang: string = 'ja'): Promise<ApiResponse> {
    const response = await fetch(
      `${API_BASE_URL}/sessions/${sessionId}/next-question?lang=${lang}`
    );
    return await response.json();
  }

  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answerOption: string
  ): Promise<{ next_question_id: string }> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        answer_option: answerOption
      })
    });
    return await response.json();
  }

  static async generateKanjiName(sessionId: string): Promise<KanjiResult> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }
}

// ===================================
// Progress Bar Component
// ===================================

const ProgressBar: React.FC<{ progress: Progress }> = ({ progress }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="progress-text">
        {progress.current_step} / {progress.total_steps}
      </div>
    </div>
  );
};

// ===================================
// Question Component
// ===================================

interface QuestionCardProps {
  question: Question;
  onAnswer: (optionId: string) => void;
  language: 'ja' | 'en';
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, language }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(selectedOption);
      setSelectedOption(null);
    }
  };

  return (
    <div className="question-card">
      <h2 className="question-text">{question.text[language]}</h2>
      <div className="options-container">
        {question.options.map((option) => (
          <button
            key={option.id}
            className={`option-button ${selectedOption === option.id ? 'selected' : ''}`}
            onClick={() => handleSelect(option.id)}
          >
            <span className="option-label">{option.id}</span>
            <span className="option-text">{option.text[language]}</span>
          </button>
        ))}
      </div>
      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!selectedOption}
      >
        {language === 'ja' ? '次へ' : 'Next'}
      </button>
    </div>
  );
};

// ===================================
// Result Component
// ===================================

const ResultCard: React.FC<{ result: KanjiResult; language: 'ja' | 'en' }> = ({
  result,
  language
}) => {
  return (
    <div className="result-card">
      <h1 className="result-title">
        {language === 'ja' ? 'あなたの漢字名' : 'Your Kanji Name'}
      </h1>

      <div className="kanji-display">
        <div className="kanji-name">{result.kanji_name}</div>
        <div className="pronunciation">
          {result.pronunciation.romaji} ({result.pronunciation.hiragana})
        </div>
      </div>

      <div className="explanation">
        <p>{result.explanation[language]}</p>
      </div>

      <div className="kanji-details">
        <div className="kanji-detail">
          <h3>{result.first_kanji.char}</h3>
          <p className="meaning">
            {language === 'ja'
              ? result.first_kanji.meaning_ja
              : result.first_kanji.meaning_en}
          </p>
          <p className="pronunciation-detail">
            音: {result.first_kanji.pronunciation_on.join('、')}
          </p>
          <p className="pronunciation-detail">
            訓: {result.first_kanji.pronunciation_kun.join('、')}
          </p>
        </div>

        <div className="kanji-detail">
          <h3>{result.second_kanji.char}</h3>
          <p className="meaning">
            {language === 'ja'
              ? result.second_kanji.meaning_ja
              : result.second_kanji.meaning_en}
          </p>
          <p className="pronunciation-detail">
            音: {result.second_kanji.pronunciation_on.join('、')}
          </p>
          <p className="pronunciation-detail">
            訓: {result.second_kanji.pronunciation_kun.join('、')}
          </p>
        </div>
      </div>

      <div className="matching-scores">
        <h3>{language === 'ja' ? 'マッチング度' : 'Matching Score'}</h3>
        <div className="score-bars">
          <ScoreBar
            label={language === 'ja' ? '総合' : 'Total'}
            score={result.matching_scores.total}
          />
          <ScoreBar
            label={language === 'ja' ? '性別適合' : 'Gender'}
            score={result.matching_scores.gender_match}
          />
          <ScoreBar
            label={language === 'ja' ? '動機適合' : 'Motivation'}
            score={result.matching_scores.motivation_match}
          />
          <ScoreBar
            label={language === 'ja' ? '性格適合' : 'Personality'}
            score={result.matching_scores.subtype_match}
          />
        </div>
      </div>

      <button className="share-button">
        {language === 'ja' ? 'シェアする' : 'Share'}
      </button>
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  return (
    <div className="score-bar">
      <span className="score-label">{label}</span>
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${score}%` }} />
      </div>
      <span className="score-value">{score}%</span>
    </div>
  );
};

// ===================================
// Main Question Flow Component
// ===================================

const QuestionFlow: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<KanjiResult | null>(null);
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // セッション初期化
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const newSessionId = await ApiClient.createSession();
        setSessionId(newSessionId);

        // 最初の質問を取得
        const response = await ApiClient.getNextQuestion(newSessionId, language);
        setCurrentQuestion(response.question);
        setProgress(response.progress);
      } catch (err) {
        setError('Failed to initialize session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // 回答送信
  const handleAnswer = async (optionId: string) => {
    if (!sessionId || !currentQuestion) return;

    try {
      setLoading(true);

      // 回答を送信
      const response = await ApiClient.submitAnswer(
        sessionId,
        currentQuestion.id,
        optionId
      );

      // 次の質問を取得
      if (response.next_question_id === 'GENERATE_RESULT') {
        // 全質問完了 → 漢字名生成
        const kanjiResult = await ApiClient.generateKanjiName(sessionId);
        setResult(kanjiResult);
        setCurrentQuestion(null);
      } else {
        // 次の質問を表示
        const nextResponse = await ApiClient.getNextQuestion(sessionId, language);
        setCurrentQuestion(nextResponse.question);
        setProgress(nextResponse.progress);
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 言語切り替え
  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  // ローディング表示
  if (loading && !currentQuestion) {
    return <div className="loading">Loading...</div>;
  }

  // エラー表示
  if (error) {
    return <div className="error">{error}</div>;
  }

  // 結果表示
  if (result) {
    return (
      <div className="container">
        <button className="language-toggle" onClick={toggleLanguage}>
          {language === 'ja' ? 'EN' : '日本語'}
        </button>
        <ResultCard result={result} language={language} />
      </div>
    );
  }

  // 質問表示
  return (
    <div className="container">
      <button className="language-toggle" onClick={toggleLanguage}>
        {language === 'ja' ? 'EN' : '日本語'}
      </button>

      {progress && <ProgressBar progress={progress} />}

      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          language={language}
        />
      )}

      {loading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
};

export default QuestionFlow;