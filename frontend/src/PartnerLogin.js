import React, { useState, useEffect } from 'react';
import './PartnerLogin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function PartnerLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset body background for partner page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
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
        onLogin(data.partner);
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
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
          <h1>Partner Portal</h1>
          <p>Sign in to view your affiliate dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="partner-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="partner-login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="partner-login-footer">
          <a href="/" className="back-link">Back to Your Kanji Name</a>
        </div>
      </div>
    </div>
  );
}

export default PartnerLogin;
