import React, { useState } from 'react';
import './StoreLanding.css';

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
      // TODO: パートナー申請APIを呼び出す
      // const response = await fetch(`${API_BASE_URL}/partner-inquiry`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // 仮の成功処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。');
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
          <h1>ポスターを貼るだけで、<br />毎月収益。</h1>
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
        <div className="benefits-grid">
          <div className="benefit-card poster-card">
            <img src="/images/calligraphy/poster.png" alt="店頭ポスター" className="poster-image" />
            <h3>やることは<br />ポスターを貼るだけ</h3>
            <p>接客不要、説明不要。<br />10か国語に自動対応するので、外国語が話せなくても大丈夫です。</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>売上の10%が<br />毎月届く</h3>
            <p>1件あたり約90円のロイヤリティ。<br />月10人で900円、100人で9,000円の不労所得に。</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">😊</div>
            <h3>お客様が<br />めっちゃ喜ぶ</h3>
            <p>日本文化に興味のある外国人観光客に大好評。<br />「最高のお土産ができた！」と笑顔で帰っていきます。</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>サービスの仕組み</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>ポスターを設置</h3>
              <p>お送りするポスターを店内に貼るだけ</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>QRコードをスキャン</h3>
              <p>観光客がスマホでアクセス</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>AIが漢字名を生成</h3>
              <p>性格診断から最適な漢字名を提案</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>書道家が手書き</h3>
              <p>プロの書道家が美しく仕上げます</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
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
        <h2>世界中の観光客に愛されています</h2>
        <div className="gallery-grid">
          {calligraphyImages.map((img, index) => (
            <div key={index} className="gallery-item">
              <img src={img} alt={`お客様の書道作品 ${index + 1}`} />
            </div>
          ))}
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
            <div className="calc-row">
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
            <h3>Q. 費用はかかりますか？</h3>
            <p>A. <strong>完全無料</strong>です。初期費用も月額費用もありません。</p>
          </div>
          <div className="faq-item">
            <h3>Q. 接客は必要ですか？</h3>
            <p>A. <strong>不要</strong>です。お客様がQRコードをスキャンして、すべてスマホで完結します。</p>
          </div>
          <div className="faq-item">
            <h3>Q. いつ振り込まれますか？</h3>
            <p>A. <strong>毎月10日</strong>に前月分のロイヤリティをお振込みします。</p>
          </div>
          <div className="faq-item">
            <h3>Q. 最低利用件数はありますか？</h3>
            <p>A. <strong>ありません</strong>。1件からロイヤリティが発生します。</p>
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
                placeholder="例：浅草土産物店"
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
                placeholder="例：03-1234-5678"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? '送信中...' : '無料で申し込む'}
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Your Kanji Name</div>
          <div className="footer-links">
            <a href="https://app.kanjiname.jp" target="_blank" rel="noopener noreferrer">サービスを試す</a>
            <a href="/terms">利用規約</a>
            <a href="/privacy">プライバシーポリシー</a>
          </div>
          <p className="copyright">© 2024 Your Kanji Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default StoreLanding;
