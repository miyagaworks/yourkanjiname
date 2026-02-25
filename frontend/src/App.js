import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import questionsData from './questions.json';
import { useLanguage } from './contexts/LanguageContext';
import { useTranslation } from './hooks/useTranslation';
import LanguageSelector from './components/LanguageSelector';
import Admin from './Admin';
import Partner from './Partner';
import Ambassador from './Ambassador';
import PaymentModal from './components/PaymentModal';
import Terms from './Terms';
import Privacy from './Privacy';
import TankaPrompt from './TankaPrompt';
import StoreLanding from './StoreLanding';
import { LuSend } from 'react-icons/lu';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// 全質問データ（API呼び出しなしで即座に表示）
const QUESTIONS = questionsData.flow;

// 開発用プレビューモード: ?preview=result でアクセス
const PREVIEW_MODE = new URLSearchParams(window.location.search).get('preview');

// パートナーコード（アフィリエイト追跡用）: ?ref=CODE でアクセス
const getPartnerCode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    // Store in sessionStorage for the duration of the session
    sessionStorage.setItem('partnerCode', refCode);
    return refCode;
  }
  // Return stored code if exists
  return sessionStorage.getItem('partnerCode');
};

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
const QuestionCard = ({ question, onAnswer, onBack, canGoBack, language }) => {
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
          <div className="navigation-buttons">
            {canGoBack && (
              <button
                className="back-button"
                onClick={onBack}
                type="button"
              >
                {t('back') || 'Back'}
              </button>
            )}
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!selectedOption}
            >
              {t('next')}
            </button>
          </div>
        </>
      )}
      {!question.options && (
        <div className="navigation-buttons">
          {canGoBack && (
            <button
              className="back-button"
              onClick={onBack}
              type="button"
            >
              {t('back') || 'Back'}
            </button>
          )}
          <button className="submit-button" onClick={() => onAnswer('continue')}>
            {t('start')}
          </button>
        </div>
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

// Calligrapher Email Signup Section (payment already done at start)
const CalligrapherSection = ({ language, kanjiName, userName, explanationJa, explanationUser, paymentIntentId, initialEmail }) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const partnerCode = sessionStorage.getItem('partnerCode');

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
          explanation_user_lang: explanationUser,
          payment_intent_id: paymentIntentId,
          partner_code: partnerCode
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
    const shareText = `My name in kanji is ${kanjiName} #MyKanjiName @yourkanjiname`;
    const shareUrl = 'https://app.kanjiname.jp';

    const handleCopyText = (text) => {
      navigator.clipboard.writeText(text).catch(() => {});
    };

    return (
      <div className="calligrapher-section">
        <div className="calligrapher-success">
          <p>{t('thankYou')}</p>
        </div>

        {/* SNS Share Section */}
        <div className="share-section">
          <h4 className="share-title">{t('shareTitle') || 'Share your kanji name'}</h4>

          {/* Kanji name preview card for sharing */}
          <div className="share-preview">
            <p className="share-preview-label">{t('yourKanjiName')}</p>
            <p className="share-preview-kanji">{kanjiName}</p>
          </div>

          {/* SNS buttons */}
          <div className="share-buttons">
            <a
              href={`https://www.instagram.com/`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-btn-instagram"
              aria-label="Share on Instagram"
            >
              Instagram
            </a>
            <a
              href={`https://www.tiktok.com/`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-btn-tiktok"
              aria-label="Share on TikTok"
            >
              TikTok
            </a>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-btn-x"
              aria-label="Share on X"
            >
              X
            </a>
          </div>

          {/* Copyable hashtag and handle */}
          <div className="share-tags">
            <button
              className="share-tag"
              onClick={() => handleCopyText('#MyKanjiName')}
              title={t('copyTag') || 'Copy'}
            >
              #MyKanjiName
            </button>
            <button
              className="share-tag"
              onClick={() => handleCopyText('@yourkanjiname')}
              title={t('copyTag') || 'Copy'}
            >
              @yourkanjiname
            </button>
          </div>

          {/* Copy-paste share text */}
          <div className="share-template">
            <p className="share-template-text">"{shareText}"</p>
            <button
              className="share-copy-btn"
              onClick={() => handleCopyText(shareText)}
            >
              {t('copyText') || 'Copy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calligrapher-section">
      <h3 className="calligrapher-title">{t('calligrapherTitle')}</h3>
      <p className="calligrapher-description">{t('calligrapherDescPaid') || 'Enter your email address to receive your calligraphy artwork.'}</p>
      <p className="calligrapher-warning">{t('emailWarning')}</p>

      <form className="calligrapher-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="calligrapher-email"
          value={email}
          onChange={(e) => {
            // Only allow ASCII email-valid characters (a-z, A-Z, 0-9, @, ., -, _, +)
            const filtered = e.target.value.replace(/[^a-zA-Z0-9@._+-]/g, '');
            setEmail(filtered);
          }}
          placeholder={t('emailPlaceholder')}
          inputMode="email"
          autoComplete="email"
          required
        />
        <button
          type="submit"
          className="calligrapher-submit"
          disabled={!email.trim() || submitting}
        >
          {submitting ? t('sending') : t('sendCalligraphy') || 'Send Calligraphy'} <LuSend style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
        </button>
      </form>
      {error && <p className="calligrapher-error">{error}</p>}

      <div className="calligrapher-samples">
        <img src="/images/calligraphy/01.png" alt="Sample 1" />
        <img src="/images/calligraphy/02.png" alt="Sample 2" />
        <img src="/images/calligraphy/03.png" alt="Sample 3" />
        <img src="/images/calligraphy/04.png" alt="Sample 4" />
      </div>
    </div>
  );
};

// Result Component
const ResultCard = ({ result, language, userName, paymentIntentId, preEmail }) => {
  const { t } = useTranslation();
  const calligrapherRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (result && result.explanation) {
      window.scrollTo(0, 0);
    }
  }, [result]);

  useEffect(() => {
    const el = calligrapherRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHintVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [result]);

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
    let text;
    if (result.explanation?.[language]) {
      text = result.explanation[language];
    } else if (language === 'ja') {
      text = result.explanation?.ja || result.explanation;
    } else {
      text = result.explanation?.en || result.explanation?.ja || result.explanation;
    }
    // Add line breaks before specific phrases (all languages)
    // Using \n\n for blank line separation
    if (text && typeof text === 'string') {
      // Japanese
      text = text.replace(/まず一文字目の漢字は、/g, '\n\nまず一文字目の漢字は、');
      text = text.replace(/二文字目の漢字は、/g, '\n\n二文字目の漢字は、');
      text = text.replace(/あなたにピッタリの漢字名が出来上がりました/g, '\n\nあなたにピッタリの漢字名が出来上がりました');
      // English
      text = text.replace(/The first character/gi, '\n\nThe first character');
      text = text.replace(/The second character/gi, '\n\nThe second character');
      text = text.replace(/Your perfect kanji name has been created/gi, '\n\nYour perfect kanji name has been created');
      // French
      text = text.replace(/Le premier caractère/gi, '\n\nLe premier caractère');
      text = text.replace(/Le (deuxième|second) caractère/gi, '\n\nLe $1 caractère');
      text = text.replace(/Votre nom kanji parfait a été créé/gi, '\n\nVotre nom kanji parfait a été créé');
      // German
      text = text.replace(/Das erste Zeichen/gi, '\n\nDas erste Zeichen');
      text = text.replace(/Das zweite Zeichen/gi, '\n\nDas zweite Zeichen');
      text = text.replace(/Ihr perfekter Kanji-Name wurde erstellt/gi, '\n\nIhr perfekter Kanji-Name wurde erstellt');
      // Spanish
      text = text.replace(/El primer carácter/gi, '\n\nEl primer carácter');
      text = text.replace(/El segundo carácter/gi, '\n\nEl segundo carácter');
      text = text.replace(/¡?Tu nombre kanji perfecto ha sido creado/gi, '\n\n¡Tu nombre kanji perfecto ha sido creado');
      // Italian
      text = text.replace(/Il primo carattere/gi, '\n\nIl primo carattere');
      text = text.replace(/Il secondo carattere/gi, '\n\nIl secondo carattere');
      text = text.replace(/Il tuo nome kanji perfetto è stato creato/gi, '\n\nIl tuo nome kanji perfetto è stato creato');
      // Korean
      text = text.replace(/첫 번째 한자는/g, '\n\n첫 번째 한자는');
      text = text.replace(/두 번째 한자는/g, '\n\n두 번째 한자는');
      text = text.replace(/당신에게 딱 맞는 한자 이름이 완성되었습니다/g, '\n\n당신에게 딱 맞는 한자 이름이 완성되었습니다');
      // Thai
      text = text.replace(/ตัวอักษรคันจิตัวแรก/g, '\n\nตัวอักษรคันจิตัวแรก');
      text = text.replace(/ตัวอักษรคันจิตัวที่สอง/g, '\n\nตัวอักษรคันจิตัวที่สอง');
      text = text.replace(/ชื่อคันจิที่เหมาะกับคุณถูกสร้างขึ้นแล้ว/g, '\n\nชื่อคันจิที่เหมาะกับคุณถูกสร้างขึ้นแล้ว');
      // Vietnamese
      text = text.replace(/Ký tự kanji đầu tiên/gi, '\n\nKý tự kanji đầu tiên');
      text = text.replace(/Ký tự kanji thứ hai/gi, '\n\nKý tự kanji thứ hai');
      text = text.replace(/Tên kanji hoàn hảo của bạn đã được tạo/gi, '\n\nTên kanji hoàn hảo của bạn đã được tạo');
      // Indonesian
      text = text.replace(/Karakter kanji pertama/gi, '\n\nKarakter kanji pertama');
      text = text.replace(/Karakter kanji kedua/gi, '\n\nKarakter kanji kedua');
      text = text.replace(/Nama kanji sempurna Anda telah dibuat/gi, '\n\nNama kanji sempurna Anda telah dibuat');
    }
    return text;
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

      <div ref={calligrapherRef}>
        <CalligrapherSection
          language={language}
          kanjiName={result.kanji_name}
          userName={userName}
          explanationJa={result.explanation?.ja || result.explanation}
          explanationUser={result.explanation?.[language] || result.explanation?.en}
          paymentIntentId={paymentIntentId}
          initialEmail={preEmail}
        />
      </div>

      <div className="matching-scores">
        <h3>{t('matchingScore')}</h3>
        <div className="score-bars">
          <ScoreBar label={t('total')} score={result.matching_scores.total} />
          <ScoreBar label={t('gender')} score={result.matching_scores.gender_match} />
          <ScoreBar label={t('motivation')} score={result.matching_scores.motivation_match} />
        </div>
      </div>

      <div
        className={`scroll-hint ${hintVisible ? '' : 'hidden'}`}
        onClick={() => calligrapherRef.current?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="scroll-hint-arrow">&#x25BC;</span>
        <span className="scroll-hint-text">{t('scrollHintCalligraphy')}</span>
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
  // Check if store landing page (kanjiname.jp/partner)
  const isStoreLandingPage =
    ((window.location.hostname === 'kanjiname.jp' || window.location.hostname === 'www.kanjiname.jp') && window.location.pathname === '/partner') ||
    window.location.pathname === '/store';

  // Check if admin, partner, ambassador, or tanka page
  const isAdminPage = window.location.pathname === '/admin';
  const isPartnerPage = window.location.pathname === '/partner';
  const isAmbassadorPage = window.location.pathname === '/ambassador';
  const isTankaPage = window.location.pathname === '/tanka';
  const isTermsPage = window.location.pathname === '/terms';
  const isPrivacyPage = window.location.pathname === '/privacy';

  // Track partner code from URL (stores to sessionStorage)
  getPartnerCode();

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
  const [showNameInput, setShowNameInput] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [, setServicePrice] = useState(null); // price loaded from API via PaymentModal
  const [answerHistory, setAnswerHistory] = useState([]); // 回答履歴を追跡
  const [showEmailPrompt, setShowEmailPrompt] = useState(false); // メール入力画面
  const [preEmail, setPreEmail] = useState(''); // 生成前のメールアドレス
  const [lastAnswerInfo, setLastAnswerInfo] = useState(null); // 最後の回答情報を保持
  const sessionIdRef = useRef(null);
  const pendingSubmitsRef = useRef([]);
  const partnerCode = sessionStorage.getItem('partnerCode');

  // 背景画像を設定
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `body::before { background-image: url(/images/pattern/wave.svg); background-size: 80px 80px; background-repeat: repeat; }`;
    document.head.appendChild(style);
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

  // 決済成功後の処理
  const handlePaymentSuccess = (intentId) => {
    setPaymentIntentId(intentId);
    setHasPaid(true);
    setShowLanding(false);
    setShowNameInput(true);
  };

  // 価格読み込み完了
  const handlePriceLoaded = useCallback((price) => {
    setServicePrice(price);
  }, []);

  // 決済スキップ（テスト用）
  const skipPayment = process.env.REACT_APP_SKIP_PAYMENT === 'true';
  const handleSkipPayment = () => {
    setPaymentIntentId('skip_payment_test');
    setHasPaid(true);
    setShowLanding(false);
    setShowNameInput(true);
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

  // 戻る処理
  const handleBack = () => {
    if (answerHistory.length === 0) {
      // 履歴がない場合は名前入力に戻る
      setCurrentQuestion(null);
      setShowNameInput(true);
      setProgress(null);
      return;
    }

    // 最後の履歴を取り出す
    const newHistory = [...answerHistory];
    const lastEntry = newHistory.pop();
    setAnswerHistory(newHistory);

    // 前の質問を表示
    const stepNum = parseInt(lastEntry.questionId.replace('Q', ''));
    setCurrentQuestion(formatQuestion(lastEntry.questionId, stepNum));
    setProgress({
      current_step: stepNum,
      total_steps: 16,
      percentage: Math.round((stepNum / 16) * 100)
    });
    window.scrollTo(0, 0);
  };

  // 回答送信
  const handleAnswer = async (optionId) => {
    if (!currentQuestion) return;

    const currentQuestionId = currentQuestion.id;
    const nextQuestionId = getNextQuestionId(currentQuestionId, optionId);

    // 次の質問を即座に表示（API待ちなし）
    if (nextQuestionId && nextQuestionId !== 'GENERATE_RESULT') {
      // 現在の質問と回答を履歴に保存
      setAnswerHistory(prev => [...prev, { questionId: currentQuestionId, optionId }]);

      const stepNum = parseInt(nextQuestionId.replace('Q', ''));
      setCurrentQuestion(formatQuestion(nextQuestionId, stepNum));
      setProgress({
        current_step: stepNum,
        total_steps: 16,
        percentage: Math.round((stepNum / 16) * 100)
      });
      window.scrollTo(0, 0);

      // 回答送信はバックグラウンドで実行（Promiseを追跡、失敗時はリトライ用に情報を保持）
      if (sessionIdRef.current && currentQuestionId !== 'Q0') {
        const promise = ApiClient.submitAnswer(sessionIdRef.current, currentQuestionId, optionId, language)
          .then(() => ({ ok: true }))
          .catch(err => {
            console.error('Background submit failed:', err);
            return { ok: false, questionId: currentQuestionId, optionId };
          });
        pendingSubmitsRef.current.push(promise);
      }
      return;
    }

    // 最後の質問（GENERATE_RESULT）の場合 → 直接ローディング＆生成を開始
    setCurrentQuestion(null);
    setLoading(true);
    window.scrollTo(0, 0);

    // 直接生成処理を実行
    (async () => {
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
        const lastSubmit = ApiClient.submitAnswer(currentSessionId, currentQuestionId, optionId, language)
          .then(() => ({ ok: true }))
          .catch(err => {
            console.error('Last submit failed:', err);
            return { ok: false, questionId: currentQuestionId, optionId };
          });
        pendingSubmitsRef.current.push(lastSubmit);

        const results = await Promise.all(pendingSubmitsRef.current);
        pendingSubmitsRef.current = [];

        const failed = results.filter(r => r && !r.ok);
        if (failed.length > 0) {
          await Promise.all(
            failed.map(f => ApiClient.submitAnswer(currentSessionId, f.questionId, f.optionId, language))
          );
        }

        const kanjiResult = await ApiClient.generateKanjiName(currentSessionId, language);
        setResult(kanjiResult);
      } catch (err) {
        setError('Failed to generate result');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  };

  // メール入力画面から生成を開始
  const handleEmailPromptContinue = async () => {
    setShowEmailPrompt(false);
    setLoading(true);

    const { questionId: lastQuestionId, optionId: lastOptionId } = lastAnswerInfo;

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
      const lastSubmit = ApiClient.submitAnswer(currentSessionId, lastQuestionId, lastOptionId, language)
        .then(() => ({ ok: true }))
        .catch(err => {
          console.error('Last submit failed:', err);
          return { ok: false, questionId: lastQuestionId, optionId: lastOptionId };
        });
      pendingSubmitsRef.current.push(lastSubmit);

      // すべてのバックグラウンド送信が完了するのを待つ
      const results = await Promise.all(pendingSubmitsRef.current);
      pendingSubmitsRef.current = [];

      // 失敗した回答をリトライ
      const failed = results.filter(r => r && !r.ok);
      if (failed.length > 0) {
        console.warn(`Retrying ${failed.length} failed answer submission(s)...`);
        await Promise.all(
          failed.map(f => ApiClient.submitAnswer(currentSessionId, f.questionId, f.optionId, language))
        );
      }

      // 漢字名生成
      const kanjiResult = await ApiClient.generateKanjiName(currentSessionId, language);
      setResult(kanjiResult);
    } catch (err) {
      setError('Failed to generate result');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Terms page
  if (isTermsPage) {
    return <Terms language="ja" onBack={() => window.history.back()} />;
  }

  // Privacy policy page
  if (isPrivacyPage) {
    return <Privacy language="ja" onBack={() => window.history.back()} />;
  }

  // Store landing page (kanjiname.jp without app. subdomain)
  if (isStoreLandingPage) {
    return <StoreLanding />;
  }

  // Tanka prompt tool page
  if (isTankaPage) {
    return <TankaPrompt />;
  }

  // Partner page
  if (isPartnerPage) {
    return <Partner />;
  }

  // Ambassador page
  if (isAmbassadorPage) {
    return <Ambassador />;
  }

  // Admin page
  if (isAdminPage) {
    return <Admin />;
  }

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

  // 利用規約ページ
  if (showTerms) {
    return <Terms language={language} onBack={() => setShowTerms(false)} />;
  }

  // ランディングページ（決済前）
  if (showLanding && !hasPaid) {
    return (
      <>
        <div className="landing-page">
          <LanguageSelector />

          {/* Section 1: Hero */}
          <section className="lp-hero">
            <img
              src="/images/logo_color.svg"
              alt="Your Kanji Name"
              className="lp-hero-logo"
            />
            <h1 className="lp-hero-title">{t('lpHeroTitle')}</h1>
            <p className="lp-hero-sub">{t('lpHeroSub')}</p>
            <button
              className="lp-hero-cta"
              onClick={() => document.getElementById('lp-payment').scrollIntoView({ behavior: 'smooth' })}
            >
              {t('lpHeroCta')}
            </button>
            <p className="lp-hero-lang">{t('lpHeroLang')}</p>
          </section>

          {/* Section 2: Gallery */}
          <section className="lp-gallery">
            <h2 className="lp-section-title">{t('lpGalleryTitle')}</h2>
            <div className="lp-gallery-grid">
              {[
                { img: '05.png', kanji: '慎匠', reading: 'Shinshō', meaningKey: 'lpGalleryMeaning1' },
                { img: '06.png', kanji: '智将', reading: 'Tomomasa', meaningKey: 'lpGalleryMeaning2' },
                { img: '07.png', kanji: '理和', reading: 'Riwa', meaningKey: 'lpGalleryMeaning3' },
                { img: '08.png', kanji: '理寧', reading: 'Rinei', meaningKey: 'lpGalleryMeaning4' },
              ].map((item) => (
                <div className="lp-gallery-item" key={item.kanji}>
                  <img
                    src={`/images/calligraphy/${item.img}`}
                    alt={item.kanji}
                    loading="lazy"
                  />
                  <p className="lp-gallery-kanji">{item.kanji} <span>({item.reading})</span></p>
                  <p className="lp-gallery-meaning">{t(item.meaningKey)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: How It Works */}
          <section className="lp-how">
            <h2 className="lp-section-title">{t('lpHowTitle')}</h2>
            <div className="lp-steps">
              <div className="lp-step">
                <span className="lp-step-num">1</span>
                <div>
                  <p className="lp-step-title">{t('lpStep1')}</p>
                </div>
              </div>
              <div className="lp-step">
                <span className="lp-step-num">2</span>
                <div>
                  <p className="lp-step-title">{t('lpStep2')}</p>
                </div>
              </div>
              <div className="lp-step">
                <span className="lp-step-num">3</span>
                <div>
                  <p className="lp-step-title">{t('lpStep3')}</p>
                  <p className="lp-step-detail">{t('lpStep3Detail')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Social Proof */}
          <section className="lp-proof">
            <p className="lp-proof-stars">★★★★★</p>
            <p className="lp-proof-rating">4.8</p>
            <p className="lp-proof-text">{t('lpProofText')}</p>
          </section>

          {/* Section 5: Closing CTA + Payment */}
          <section className="lp-cta" id="lp-payment">
            <h2 className="lp-cta-tagline">{t('lpCtaTagline')}</h2>

            {skipPayment ? (
              <button className="lp-hero-cta" onClick={handleSkipPayment}>
                {t('startFree')}
              </button>
            ) : (
              <PaymentModal
                email=""
                kanjiName=""
                partnerCode={partnerCode}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {}}
                isLandingPage={true}
                onPriceLoaded={handlePriceLoaded}
              />
            )}

            <button className="terms-link" onClick={() => setShowTerms(true)}>
              {t('termsLink')}
            </button>
          </section>
        </div>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
        </footer>
      </>
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

  // メール入力画面（生成前）
  if (showEmailPrompt) {
    return (
      <>
        <div className="container">
          <LanguageSelector />
          <div className="question-card">
            <p className="question-text" style={{ fontSize: '1rem', lineHeight: '1.8' }}>
              {t('emailPromptMessage')}
            </p>
            <input
              type="email"
              className="name-input"
              value={preEmail}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^a-zA-Z0-9@._+-]/g, '');
                setPreEmail(filtered);
              }}
              placeholder={t('emailPlaceholder')}
              inputMode="email"
              autoComplete="email"
              autoFocus
            />
            <div className="navigation-buttons">
              <button
                className="back-button"
                onClick={handleEmailPromptContinue}
              >
                {t('emailPromptSkip')}
              </button>
              <button
                className="submit-button"
                onClick={handleEmailPromptContinue}
              >
                {preEmail.trim() ? t('emailPromptSubmit') : t('emailPromptSkip')}
              </button>
            </div>
          </div>
        </div>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
        </footer>
      </>
    );
  }

  // 結果表示
  if (result) {
    return (
      <>
        <div className="container result-container">
          <LanguageSelector />
          <ResultCard result={result} language={language} userName={userName} paymentIntentId={paymentIntentId} preEmail={preEmail} />
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
            onBack={handleBack}
            canGoBack={true}
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