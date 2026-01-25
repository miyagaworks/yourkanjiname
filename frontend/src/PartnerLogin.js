import React, { useState, useEffect } from 'react';
import './PartnerLogin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function PartnerLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset body styles for partner page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('display', 'block', 'important');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/partner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and partner info
        sessionStorage.setItem('partnerToken', data.token);
        sessionStorage.setItem('partnerInfo', JSON.stringify(data.partner));
        // Scroll to top before showing dashboard
        window.scrollTo(0, 0);
        onLogin(data.partner);
      } else {
        setError(data.error?.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインに失敗しました。もう一度お試しください。');
    }

    setLoading(false);
  };

  return (
    <div className="partner-login-container">
      <div className="partner-login-card">
        <div className="partner-login-header">
          <img
            src="/images/logo_color.svg"
            alt="Your Kanji Name"
            className="partner-logo"
          />
          <h1>パートナーポータル</h1>
          <p>アフィリエイトダッシュボードにログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="partner-login-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="partner-login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="partner-login-footer">
          <a href="/" className="back-link">Your Kanji Nameに戻る</a>
        </div>
      </div>
    </div>
  );
}

export default PartnerLogin;
