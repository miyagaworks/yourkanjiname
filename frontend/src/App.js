import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import questionsData from './questions.json';
import { useLanguage } from './contexts/LanguageContext';
import { useTranslation } from './hooks/useTranslation';
import LanguageSelector from './components/LanguageSelector';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// 全質問データ（API呼び出しなしで即座に表示）
const QUESTIONS = questionsData.flow;

// 開発用プレビューモード: ?preview=result でアクセス
const PREVIEW_MODE = new URLSearchParams(window.location.search).get('preview');

// プレビュー用モックデータ
const MOCK_RESULT = {
  kanji_name: '理帆',
  first_kanji: {
    char: '理',
    meaning_ja: '理、道理、筋道',
    meaning_en: 'reason, logic, truth',
    pronunciation: 'り'
  },
  second_kanji: {
    char: '帆',
    meaning_ja: '帆、船の帆',
    meaning_en: 'sail',
    pronunciation: 'ほ'
  },
  explanation: {
    ja: 'ジョンさんの持つ「論理性」と「自由欲」という、一見対照的でありながら深く結びついた性質を表現するために、「理帆（りほ）」という名前を提案します。最初の漢字である「理」は、物事の筋道や法則を意味し、あなたの高い知性と論理的な思考能力を象徴しています。あなたは常に物事の本質を見極め、理性的な判断を下すことができる人です。\n\n二番目の漢字「帆」は、風を受けて大海原を自由に進む船の帆を表しています。これはあなたの内に秘めた自由への渇望と、束縛されることなく自分らしく生きたいという強い願望を象徴しています。理性という羅針盤を持ちながら、自由の風を帆に受けて人生という大海原を航海していく。それがあなたの生き方です。\n\nあなたにピッタリの漢字名が出来上がりました！',
    en: 'To express John\'s "logical nature" and "desire for freedom" - seemingly contrasting yet deeply connected qualities - we propose the name "Riho" (理帆). The first kanji "理" (ri) means reason, logic, and truth, symbolizing your high intelligence and logical thinking ability. You are someone who can always discern the essence of things and make rational judgments.\n\nThe second kanji "帆" (ho) represents a ship\'s sail catching the wind and freely crossing the ocean. This symbolizes your inner thirst for freedom and strong desire to live authentically without constraints. With reason as your compass and freedom as the wind in your sails, you navigate the ocean of life. This is your way of living.\n\nYour perfect kanji name is complete!'
  },
  matching_scores: {
    total: 93,
    gender_match: 90,
    motivation_match: 95
  }
};

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

  async generateKanjiName(sessionId, language = 'en') {
    const response = await fetch(`${API_BASE_URL}/generate?session_id=${sessionId}&lang=${language}`, {
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
  const { t } = useTranslation();

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
            {t('next')}
          </button>
        </>
      )}
      {!question.options && (
        <button className="submit-button" onClick={() => onAnswer('continue')}>
          {t('start')}
        </button>
      )}
    </div>
  );
};

// Sakura (Cherry Blossom) Effect Component
const SakuraEffect = () => {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 20000); // 20秒後にフェードアウト開始

    const hideTimer = setTimeout(() => {
      setHidden(true);
    }, 23000); // 23秒後に完全に非表示

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  const petals = Array.from({ length: 30 }, (_, i) => {
    // 奥行き: 0 = 最奥（小さい）, 1 = 最手前（大きい、ぼやける）
    const depth = Math.random();
    const imageNum = (i % 5) + 1; // 01.png〜05.png

    return {
      id: i,
      image: `/images/sakura/0${imageNum}.png`,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 8, // 8〜16秒
      size: depth < 0.8 ? 15 + Math.random() * 10 : // 奥 (80%): 15-25px
            depth < 0.95 ? 22 + Math.random() * 10 : // 中 (15%): 22-32px
            45 + Math.random() * 25, // 手前 (5%): 45-70px
      blur: depth < 0.8 ? 0 : depth < 0.95 ? 1 : 4 + Math.random() * 3, // 手前ほどぼやける
      opacity: depth < 0.8 ? 0.5 : depth < 0.95 ? 0.7 : 0.85,
      swayAmount: 30 + Math.random() * 50, // 横揺れ幅
      swayDuration: 2 + Math.random() * 3, // 横揺れ周期
      rotateStart: Math.random() * 360,
      rotateEnd: Math.random() > 0.5 ? 360 + Math.random() * 180 : -360 - Math.random() * 180,
      zIndex: Math.floor(depth * 10)
    };
  });

  return (
    <div className={`sakura-container ${fading ? 'fading' : ''}`}>
      {petals.map(petal => (
        <div
          key={petal.id}
          className="sakura-petal"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            zIndex: petal.zIndex,
            '--sway-amount': `${petal.swayAmount}px`,
            '--sway-duration': `${petal.swayDuration}s`,
            '--rotate-start': `${petal.rotateStart}deg`,
            '--rotate-end': `${petal.rotateEnd}deg`,
            '--petal-opacity': petal.opacity
          }}
        >
          <img
            src={petal.image}
            alt=""
            style={{
              width: `${petal.size}px`,
              height: 'auto',
              filter: petal.blur > 0 ? `blur(${petal.blur}px)` : 'none'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Calligrapher Email Signup Section
const CalligrapherSection = ({ language, kanjiName, userName, explanationJa, explanationUser }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/calligrapher-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          kanji_name: kanjiName,
          user_name: userName,
          language,
          explanation_ja: explanationJa,
          explanation_user_lang: explanationUser
        })
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit calligrapher request:', err);
      setError(t('requestError') || 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="calligrapher-section">
        <div className="calligrapher-success">
          <p>{t('thankYou')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calligrapher-section">
      <h3 className="calligrapher-title">{t('calligrapherTitle')}</h3>
      <p className="calligrapher-description">{t('calligrapherDesc')}</p>

      <div className="calligrapher-samples">
        <img src="/images/calligraphy/01.png" alt="Sample 1" />
        <img src="/images/calligraphy/02.png" alt="Sample 2" />
        <img src="/images/calligraphy/03.png" alt="Sample 3" />
        <img src="/images/calligraphy/04.png" alt="Sample 4" />
      </div>

      <form className="calligrapher-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="calligrapher-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
        />
        <button
          type="submit"
          className="calligrapher-submit"
          disabled={!email.trim() || submitting}
        >
          {submitting ? t('sending') : t('request')}
        </button>
      </form>
      {error && <p className="calligrapher-error">{error}</p>}
    </div>
  );
};

// Result Component
const ResultCard = ({ result, language, userName }) => {
  const { t } = useTranslation();

  if (!result || !result.explanation) {
    return null;
  }

  // For kanji meaning, use user language if available, fallback to en, then ja
  const getMeaning = (kanji) => {
    if (kanji[`meaning_${language}`]) return kanji[`meaning_${language}`];
    if (language === 'ja') return kanji.meaning_ja;
    return kanji.meaning_en || kanji.meaning_ja;
  };

  // For explanation, use user language if available, fallback to en, then ja
  const getExplanation = () => {
    if (result.explanation?.[language]) return result.explanation[language];
    if (language === 'ja') return result.explanation?.ja || result.explanation;
    return result.explanation?.en || result.explanation?.ja || result.explanation;
  };

  return (
    <div className="result-card">
      <SakuraEffect />
      <h1 className="result-title">{t('yourKanjiName')}</h1>

      <div className="kanji-display">
        <div className="kanji-name">{result.kanji_name}</div>
        <div className="pronunciation">
          {userName}
        </div>
      </div>

      <div className="explanation">
        <p>{getExplanation()}</p>
      </div>

      <div className="kanji-details">
        <div className="kanji-detail">
          <h3>{result.first_kanji.char}</h3>
          <p className="meaning">{getMeaning(result.first_kanji)}</p>
        </div>

        <div className="kanji-detail">
          <h3>{result.second_kanji.char}</h3>
          <p className="meaning">{getMeaning(result.second_kanji)}</p>
        </div>
      </div>

      <CalligrapherSection
        language={language}
        kanjiName={result.kanji_name}
        userName={userName}
        explanationJa={result.explanation?.ja || result.explanation}
        explanationUser={result.explanation?.[language] || result.explanation?.en}
      />

      <div className="matching-scores">
        <h3>{t('matchingScore')}</h3>
        <div className="score-bars">
          <ScoreBar label={t('total')} score={result.matching_scores.total} />
          <ScoreBar label={t('gender')} score={result.matching_scores.gender_match} />
          <ScoreBar label={t('motivation')} score={result.matching_scores.motivation_match} />
        </div>
      </div>

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

// Loading messages keys for progressive display
const LOADING_MESSAGE_KEYS = ['loading1', 'loading2', 'loading3', 'loading4'];

// Main App Component
function App() {
  const [, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const { language } = useLanguage();
  const { t } = useTranslation();
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

  // プレビューモード: 結果ページを直接表示
  useEffect(() => {
    if (PREVIEW_MODE === 'result') {
      setShowSplash(false);
      setShowNameInput(false);
      setUserName('John');
      setResult(MOCK_RESULT);
    }
  }, []);

  // スプラッシュアニメーション + APIウォームアップ
  useEffect(() => {
    if (PREVIEW_MODE) return; // プレビューモードではスキップ

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
        const maxStep = LOADING_MESSAGE_KEYS.length - 1;
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
      const kanjiResult = await ApiClient.generateKanjiName(currentSessionId, language);
      setResult(kanjiResult);
      setCurrentQuestion(null);
    } catch (err) {
      setError('Failed to generate result');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <LanguageSelector />
          <div className="question-card">
            <h2 className="question-text">
              {t('enterName')}
            </h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                className="name-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
              <button
                type="submit"
                className="submit-button"
                disabled={!userName.trim() || loading}
              >
                {t('start')}
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
          <LanguageSelector />
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
        <LanguageSelector />

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
              <div className="loading-step">{t(LOADING_MESSAGE_KEYS[loadingStep])}</div>
              <div className="loading-progress">
                {LOADING_MESSAGE_KEYS.map((_, i) => (
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