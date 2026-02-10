import React, { useState } from 'react';
import { FiZoomIn } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { FaQuestionCircle } from 'react-icons/fa';
import { MdQuestionAnswer } from 'react-icons/md';
import { LuSend } from 'react-icons/lu';
import './StoreLanding.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// 書道サンプル画像
const calligraphyImages = [
  '/images/calligraphy/01.png',
  '/images/calligraphy/02.png',
  '/images/calligraphy/03.png',
  '/images/calligraphy/04.png',
  '/images/calligraphy/05.png',
  '/images/calligraphy/06.png',
  '/images/calligraphy/07.png',
  '/images/calligraphy/08.png',
];

function StoreLanding() {
  const [formData, setFormData] = useState({
    storeName: '',
    contactName: '',
    email: '',
    phone: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPosterModal, setShowPosterModal] = useState(false);

  // 画像自動切り替え
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % calligraphyImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/partner-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '送信に失敗しました');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || '送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="store-landing">
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <h1>ポスターを貼るだけで<br />新しい収入源。</h1>
          <p className="hero-subtitle">
            外国人観光客に大人気の「漢字名」サービスで、<br />
            お店の新しい収入源を作りませんか？
          </p>
          <a href="#contact" className="cta-button">無料で始める</a>
        </div>
        <div className="hero-image">
          <img
            src={calligraphyImages[activeImage]}
            alt="書道作品サンプル"
            className="hero-calligraphy"
          />
        </div>
      </header>

      {/* Benefits Section */}
      <section className="benefits">
        <h2>選ばれる3つの理由</h2>
        <p className="section-subtitle">初期費用ゼロ、接客不要、手間なし。</p>
        <div className="benefits-grid">
          <div className="benefit-card poster-card">
            <span className="benefit-number">1</span>
            <div className="poster-container">
              <img src="/images/partner/poster.png" alt="店頭ポスター" className="poster-image" />
              <button className="poster-zoom-btn" onClick={() => setShowPosterModal(true)}>
                <FiZoomIn />
              </button>
            </div>
            <h3>やることは<br />ポスターを貼るだけ</h3>
            <p>接客不要、説明不要。<br />10か国語に自動対応するので、外国語が話せなくても大丈夫です。</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-number">2</span>
            <img src="/images/partner/wakuwaku.png" alt="" className="benefit-icon-img" />
            <h3>売上の10%を<br />毎月受け取れる</h3>
            <p>1件あたり約90円のロイヤリティ。<br />月10人で900円、100人で9,000円の不労所得に。</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-number">3</span>
            <img src="/images/partner/cool.png" alt="" className="benefit-icon-img" />
            <h3>お客様が<br />めっちゃ喜ぶ</h3>
            <p>日本文化に興味のある外国人観光客に大好評。<br />「最高のお土産ができた！」と笑顔で帰っていきます。</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>サービスの仕組み</h2>
        <div className="steps">
          <div className="step step-highlight">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>ポスターを設置</h3>
              <p>専用ポスターを店内に貼るだけ</p>
              <span className="step-badge">ここだけお願いします</span>
            </div>
          </div>
          <div className="step-arrow"><IoIosArrowDown /></div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>QRコードをスキャン</h3>
              <p>観光客がスマホでアクセス</p>
            </div>
          </div>
          <div className="step-arrow"><IoIosArrowDown /></div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>AIが漢字名を生成</h3>
              <p>性格診断から最適な漢字名を提案</p>
            </div>
          </div>
          <div className="step-arrow"><IoIosArrowDown /></div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>書道家が手書き</h3>
              <p>プロの書道家が美しく仕上げます</p>
            </div>
          </div>
          <div className="step-arrow"><IoIosArrowDown /></div>
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>毎月10%をお振込</h3>
              <p>翌月10日にロイヤリティをお支払い</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery">
        <h2>日本の心を、あなたのお店から世界へ</h2>
        <div className="gallery-grid">
          {calligraphyImages.map((img, index) => (
            <div key={index} className="gallery-item">
              <img src={img} alt={`お客様の書道作品 ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className="gallery-message">
          <p className="gallery-message-lead">名前に、意味を。</p>
          <p className="gallery-message-body">
            外国人の名前はアルファベットの羅列であり、その文字自体に意味を持ちません。<br />
            しかし漢字名は、一文字一文字に深い意味が宿ります。<br />
            まるで名前をつけてくれたお父さん、お母さんの温かい想いが<br className="pc-only" />
            込められているように——。<br />
            そんな日本の心を、あなたのお店から届けてみませんか。
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="calculator">
        <h2>あなたのお店ではいくらになる？</h2>
        <div className="calculator-content">
          <div className="calc-example">
            <div className="calc-row">
              <span>1日の外国人客数</span>
              <span className="calc-value">30人</span>
            </div>
            <div className="calc-row">
              <span>利用率（10人に1人）</span>
              <span className="calc-value">3人/日</span>
            </div>
            <div className="calc-row">
              <span>月間営業日数</span>
              <span className="calc-value">25日</span>
            </div>
            <div className="calc-row calc-last">
              <span>1件あたりのロイヤリティ</span>
              <span className="calc-value">約90円</span>
            </div>
            <div className="calc-divider"></div>
            <div className="calc-row calc-total">
              <span>月間予想収益</span>
              <span className="calc-value highlight">約6,750円/月</span>
            </div>
          </div>
          <p className="calc-note">※ 外国人客が多い店舗では月10,000円以上も可能</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <h2>よくある質問</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3><FaQuestionCircle className="faq-icon faq-q" /><span>費用はかかりますか？</span></h3>
            <p><MdQuestionAnswer className="faq-icon faq-a" /><span><strong>完全無料</strong>です。初期費用も月額費用もありません。</span></p>
          </div>
          <div className="faq-item">
            <h3><FaQuestionCircle className="faq-icon faq-q" /><span>接客は必要ですか？</span></h3>
            <p><MdQuestionAnswer className="faq-icon faq-a" /><span><strong>不要</strong>です。お客様がQRコードをスキャンして、すべてスマホで完結します。</span></p>
          </div>
          <div className="faq-item">
            <h3><FaQuestionCircle className="faq-icon faq-q" /><span>いつ振り込まれますか？</span></h3>
            <p><MdQuestionAnswer className="faq-icon faq-a" /><span><strong>毎月10日</strong>に前月分のロイヤリティをお振込みします。</span></p>
          </div>
          <div className="faq-item">
            <h3><FaQuestionCircle className="faq-icon faq-q" /><span>最低利用件数はありますか？</span></h3>
            <p><MdQuestionAnswer className="faq-icon faq-a" /><span><strong>ありません</strong>。1件からロイヤリティが発生します。</span></p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact" id="contact">
        <h2>今すぐ無料で始める</h2>
        {submitted ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>お申し込みありがとうございます</h3>
            <p>担当者より2営業日以内にご連絡いたします。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="storeName">店舗名 *</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                required
                placeholder="例：お好み焼き〇〇"
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactName">ご担当者名 *</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                placeholder="例：山田太郎"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">メールアドレス *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="例：info@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">電話番号（任意）</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="例：090-1234-5678"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="store-submit-button" disabled={submitting}>
              {submitting ? '送信中...' : <><span>無料で申し込む</span><LuSend className="send-icon" /></>}
            </button>
          </form>
        )}
      </section>

      {/* Poster Modal */}
      {showPosterModal && (
        <div className="poster-modal-overlay" onClick={() => setShowPosterModal(false)}>
          <div className="poster-modal" onClick={(e) => e.stopPropagation()}>
            <button className="poster-modal-close" onClick={() => setShowPosterModal(false)}>×</button>
            <img src="/images/partner/poster.png" alt="店頭ポスター" className="poster-modal-image" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <img src="/images/logo_white.png" alt="Your Kanji Name" className="footer-logo-img" />
          <div className="footer-links">
            <a href="https://app.kanjiname.jp" target="_blank" rel="noopener noreferrer">サービスページへ</a>
            <a href="/terms">利用規約</a>
            <a href="/privacy">プライバシーポリシー</a>
          </div>
          <p className="copyright">© {new Date().getFullYear()} Your Kanji Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default StoreLanding;
