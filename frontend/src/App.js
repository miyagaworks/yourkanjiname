import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import questionsData from './questions.json';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// 全質問データ（API呼び出しなしで即座に表示）
const QUESTIONS = questionsData.flow;

// API Client
const ApiClient = {
  async createSession(userName) {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName })
    });
    const data = await response.json();
    return data.session_id;
  },

  async getNextQuestion(sessionId, lang = 'ja') {
    const response = await fetch(
      `${API_BASE_URL}/sessions?session_id=${sessionId}&action=next-question&lang=${lang}`
    );
    return await response.json();
  },

  async submitAnswer(sessionId, questionId, answerOption, lang = 'ja') {
    const response = await fetch(`${API_BASE_URL}/answers?lang=${lang}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        answer_option: answerOption
      })
    });
    return await response.json();
  },

  async generateKanjiName(sessionId) {
    const response = await fetch(`${API_BASE_URL}/generate?session_id=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }
};

// Progress Bar Component
const ProgressBar = ({ progress }) => {
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

// Question Component
const QuestionCard = ({ question, onAnswer, language }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelect = (optionId) => {
    setSelectedOption(optionId);
    // スマホ表示で次へボタンが見えるように最下部にスクロール
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(selectedOption);
      setSelectedOption(null);
    }
  };

  // 性別選択の場合はグリッド表示
  const isGenderQuestion = question.type === 'gender_declaration';

  return (
    <div className="question-card">
      <h2 className="question-text">{question.text[language]}</h2>
      {question.options && (
        <>
          <div className={`options-container ${isGenderQuestion ? 'gender-options' : ''}`}>
            {question.options.map((option) => (
              <button
                key={option.id}
                className={`option-button ${selectedOption === option.id ? 'selected' : ''} ${isGenderQuestion ? 'gender-option' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
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
        </>
      )}
      {!question.options && (
        <button className="submit-button" onClick={() => onAnswer('continue')}>
          {language === 'ja' ? '始める' : 'Start'}
        </button>
      )}
    </div>
  );
};

// Result Component
const ResultCard = ({ result, language, userName }) => {
  if (!result || !result.explanation) {
    return null;
  }

  return (
    <div className="result-card">
      <h1 className="result-title">
        {language === 'ja' ? 'あなたの漢字名' : 'Your Kanji Name'}
      </h1>

      <div className="kanji-display">
        <div className="kanji-name">{result.kanji_name}</div>
        <div className="pronunciation">
          {userName}
        </div>
      </div>

      <div className="explanation">
        <p>{result.explanation?.[language] || result.explanation}</p>
      </div>

      <div className="kanji-details">
        <div className="kanji-detail">
          <h3>{result.first_kanji.char}</h3>
          <p className="meaning">
            {language === 'ja'
              ? result.first_kanji.meaning_ja
              : result.first_kanji.meaning_en}
          </p>
        </div>

        <div className="kanji-detail">
          <h3>{result.second_kanji.char}</h3>
          <p className="meaning">
            {language === 'ja'
              ? result.second_kanji.meaning_ja
              : result.second_kanji.meaning_en}
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
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <button className="share-button" onClick={() => window.location.reload()}>
          {language === 'ja' ? 'もう一度' : 'Try Again'}
        </button>
      )}
    </div>
  );
};

const ScoreBar = ({ label, score }) => {
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

// Loading messages for progressive display
const LOADING_MESSAGES = {
  ja: [
    '性格を分析中...',
    '最適な漢字を選定中...',
    '説明文を作成中...',
    'もうすぐ完成です...'
  ],
  en: [
    'Analyzing your personality...',
    'Selecting the perfect kanji...',
    'Creating your story...',
    'Almost done...'
  ]
};

// Main App Component
function App() {
  const [, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('ja');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const sessionIdRef = useRef(null);
  const pendingSubmitsRef = useRef([]);

  // 背景画像を設定
  useEffect(() => {
    document.body.style.setProperty('background-image', 'url(/images/washi-texture.webp)', 'important');
    document.body.style.setProperty('background-size', 'cover', 'important');
    document.body.style.setProperty('background-position', 'center', 'important');
    document.body.style.setProperty('background-attachment', 'fixed', 'important');
  }, []);

  // スプラッシュアニメーション + APIウォームアップ
  useEffect(() => {
    // スプラッシュ表示中にAPIをウォームアップ（コールドスタート対策）
    fetch(`${API_BASE_URL}/sessions`, { method: 'OPTIONS' }).catch(() => {});

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3秒に短縮
    return () => clearTimeout(timer);
  }, []);

  // ローディング中のメッセージ切り替え
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep(prev => {
        const maxStep = LOADING_MESSAGES.ja.length - 1;
        return prev < maxStep ? prev + 1 : prev;
      });
    }, 2500); // 2.5秒ごとに切り替え

    return () => clearInterval(interval);
  }, [loading]);

  // 質問をフォーマット
  const formatQuestion = (questionId, step) => {
    const q = QUESTIONS[questionId];
    return {
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options?.map(opt => ({ id: opt.id, text: opt.text }))
    };
  };

  // 次の質問IDを取得
  const getNextQuestionId = (questionId, optionId) => {
    const q = QUESTIONS[questionId];
    if (q.options) {
      const opt = q.options.find(o => o.id === optionId);
      return opt?.next || q.next;
    }
    return q.next;
  };

  // 名前入力後にセッション初期化
  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    // 即座にQ0を表示（API待ちなし）
    setCurrentQuestion(formatQuestion('Q0', 0));
    setProgress({ current_step: 0, total_steps: 16, percentage: 0 });
    setShowNameInput(false);

    // セッション作成はバックグラウンドで実行
    try {
      const newSessionId = await ApiClient.createSession(userName.trim());
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
    } catch (err) {
      setError('Failed to initialize session');
      console.error(err);
    }
  };

  // 回答送信
  const handleAnswer = async (optionId) => {
    if (!currentQuestion) return;

    const currentQuestionId = currentQuestion.id;
    const nextQuestionId = getNextQuestionId(currentQuestionId, optionId);

    // 次の質問を即座に表示（API待ちなし）
    if (nextQuestionId && nextQuestionId !== 'GENERATE_RESULT') {
      const stepNum = parseInt(nextQuestionId.replace('Q', ''));
      setCurrentQuestion(formatQuestion(nextQuestionId, stepNum));
      setProgress({
        current_step: stepNum,
        total_steps: 16,
        percentage: Math.round((stepNum / 16) * 100)
      });
      window.scrollTo(0, 0);

      // 回答送信はバックグラウンドで実行（Promiseを追跡）
      if (sessionIdRef.current && currentQuestionId !== 'Q0') {
        const promise = ApiClient.submitAnswer(sessionIdRef.current, currentQuestionId, optionId, language)
          .catch(err => console.error('Background submit failed:', err));
        pendingSubmitsRef.current.push(promise);
      }
      return;
    }

    // 最後の質問（GENERATE_RESULT）の場合
    setLoading(true);

    // セッションがまだ準備できていない場合は待つ
    let currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      for (let i = 0; i < 50 && !sessionIdRef.current; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      currentSessionId = sessionIdRef.current;
      if (!currentSessionId) {
        setError('Session not ready. Please try again.');
        setLoading(false);
        return;
      }
    }

    try {
      // 最後の回答をpendingに追加
      const lastSubmit = ApiClient.submitAnswer(currentSessionId, currentQuestionId, optionId, language);
      pendingSubmitsRef.current.push(lastSubmit);

      // すべてのバックグラウンド送信が完了するのを待つ
      await Promise.all(pendingSubmitsRef.current);
      pendingSubmitsRef.current = [];

      // 漢字名生成
      const kanjiResult = await ApiClient.generateKanjiName(currentSessionId);
      setResult(kanjiResult);
      setCurrentQuestion(null);
    } catch (err) {
      setError('Failed to generate result');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 言語切り替え
  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  // スプラッシュスクリーン
  if (showSplash) {
    return (
      <div className={`splash-screen ${!showSplash ? 'fade-out' : ''}`}>
        <img
          src="/images/logo_color.svg"
          alt="Your Kanji Name"
          className="splash-logo"
        />
      </div>
    );
  }

  // 名前入力画面
  if (showNameInput) {
    return (
      <>
        <div className="container">
          <button className="language-toggle" onClick={toggleLanguage}>
            {language === 'ja' ? 'EN' : '日本語'}
          </button>
          <div className="question-card">
            <h2 className="question-text">
              {language === 'ja' ? 'あなたのフルネームを教えてください' : 'Please tell us your full name'}
            </h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                className="name-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={language === 'ja' ? '例: John Smith' : 'e.g., John Smith'}
                autoFocus
              />
              <button
                type="submit"
                className="submit-button"
                disabled={!userName.trim() || loading}
              >
                {language === 'ja' ? '始める' : 'Start'}
              </button>
            </form>
          </div>
        </div>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
        </footer>
      </>
    );
  }

  // ローディング表示
  if (loading && !currentQuestion && !result) {
    return <div className="loading">Loading...</div>;
  }

  // エラー表示
  if (error) {
    return <div className="error">{error}</div>;
  }

  // 結果表示
  if (result) {
    return (
      <>
        <div className="container">
          <button className="language-toggle" onClick={toggleLanguage}>
            {language === 'ja' ? 'EN' : '日本語'}
          </button>
          <ResultCard result={result} language={language} userName={userName} />
        </div>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
        </footer>
      </>
    );
  }

  // 質問表示
  return (
    <>
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

        {loading && (
          <div className="loading-overlay">
            <div className="loader">
              <div className="spinner"></div>
            </div>
            <div className="loading-text">
              <div className="loading-step">{LOADING_MESSAGES[language][loadingStep]}</div>
              <div className="loading-progress">
                {[...Array(LOADING_MESSAGES[language].length)].map((_, i) => (
                  <span key={i} className={`progress-dot ${i <= loadingStep ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;