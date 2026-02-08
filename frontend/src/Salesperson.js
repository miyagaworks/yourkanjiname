import React, { useState, useEffect } from 'react';
import './Admin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function Salesperson() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset body background for dashboard page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
  }, []);

  // Check session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('salespersonSession');
    if (token) {
      setIsLoggedIn(true);
      fetchDashboard(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL}/salesperson/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('salespersonSession', data.token);
        setIsLoggedIn(true);
        fetchDashboard(data.token);
      } else {
        setLoginError(data.error?.message || 'ログインに失敗しました');
      }
    } catch (error) {
      setLoginError('ログインに失敗しました');
    }
  };

  const fetchDashboard = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/salesperson/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDashboard(data);
      } else if (data.error?.code === 'UNAUTHORIZED') {
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('salespersonSession');
    setIsLoggedIn(false);
    setDashboard(null);
  };

  // Calculate contract end date
  const getContractEndDate = (start, months) => {
    if (!start || !months) return null;
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(months, 10));
    return endDate;
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h1>営業マンダッシュボード</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
            />
            <button type="submit">ログイン</button>
          </form>
          {loginError && <p className="error">{loginError}</p>}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>営業マンダッシュボード</h1>
        <div className="header-right">
          {dashboard?.salesperson && (
            <span className="welcome-text">
              {dashboard.salesperson.name} さん
            </span>
          )}
          <button onClick={handleLogout} className="logout-btn">ログアウト</button>
        </div>
      </header>

      <div className="admin-content">
        {loading ? (
          <p>読み込み中...</p>
        ) : dashboard ? (
          <>
            {/* Summary Stats */}
            <div className="payment-stats">
              <div className="stat-card highlight">
                <div className="stat-label">今月のロイヤリティ</div>
                <div className="stat-value">${dashboard.current_month?.royalty_amount?.toFixed(2) || '0.00'}</div>
                <div className="stat-sublabel">{dashboard.current_month?.year_month}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">未払いロイヤリティ</div>
                <div className="stat-value pending-amount">${dashboard.summary?.pending_royalty?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">累計ロイヤリティ</div>
                <div className="stat-value">${dashboard.summary?.total_royalty?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">ロイヤリティ率</div>
                <div className="stat-value">{(dashboard.salesperson?.royalty_rate * 100).toFixed(0)}%</div>
              </div>
            </div>

            <div className="payment-stats" style={{ marginTop: '20px' }}>
              <div className="stat-card">
                <div className="stat-label">紹介パートナー数</div>
                <div className="stat-value">{dashboard.summary?.partner_count || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">アクティブパートナー</div>
                <div className="stat-value">{dashboard.summary?.active_partner_count || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">累計決済数</div>
                <div className="stat-value">{dashboard.summary?.total_payments || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">累計売上</div>
                <div className="stat-value">${dashboard.summary?.total_revenue?.toFixed(2) || '0.00'}</div>
              </div>
            </div>

            {/* Partners List */}
            <div className="partners-section" style={{ marginTop: '40px' }}>
              <h2>紹介パートナー一覧</h2>
              <table className="partners-table">
                <thead>
                  <tr>
                    <th>店舗名</th>
                    <th>コード</th>
                    <th>契約期間</th>
                    <th>残り期間</th>
                    <th>決済数</th>
                    <th>売上</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.partners?.map(p => {
                    const endDate = getContractEndDate(p.contract_start, p.contract_months);
                    return (
                      <tr key={p.id} className={!p.is_active ? 'inactive-row' : ''}>
                        <td data-label="店舗名">{p.name}</td>
                        <td data-label="コード"><code>{p.code}</code></td>
                        <td data-label="契約期間">
                          {p.contract_start ? (
                            <>
                              {new Date(p.contract_start).toLocaleDateString('ja-JP')}
                              <br />
                              <small className="muted">〜 {endDate?.toLocaleDateString('ja-JP')}</small>
                            </>
                          ) : '-'}
                        </td>
                        <td data-label="残り期間">
                          {p.is_active ? (
                            <span className="active-contract">{p.remaining_months}ヶ月</span>
                          ) : (
                            <span className="expired-contract">終了</span>
                          )}
                        </td>
                        <td data-label="決済数">{p.total_payments}</td>
                        <td data-label="売上">${p.total_revenue?.toFixed(2)}</td>
                        <td data-label="状態">
                          <span className={`status-badge status-${p.status}`}>
                            {p.status === 'active' ? '有効' : '無効'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {dashboard.partners?.length === 0 && (
                <p className="no-data">紹介パートナーはまだありません</p>
              )}
            </div>

            {/* Monthly Stats */}
            <div className="partners-section" style={{ marginTop: '40px' }}>
              <h2>月別実績</h2>
              <table className="payouts-table">
                <thead>
                  <tr>
                    <th>月</th>
                    <th>決済数</th>
                    <th>売上</th>
                    <th>ロイヤリティ</th>
                    <th>支払い状態</th>
                    <th>支払日</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.monthly_stats?.map(ms => (
                    <tr key={ms.year_month}>
                      <td data-label="月">{ms.year_month}</td>
                      <td data-label="決済数">{ms.total_payments}</td>
                      <td data-label="売上">${ms.total_revenue?.toFixed(2)}</td>
                      <td data-label="ロイヤリティ" className="royalty-amount">${ms.royalty_amount?.toFixed(2)}</td>
                      <td data-label="状態">
                        <span className={`status-badge ${ms.payout_status === 'paid' ? 'status-sent' : 'status-pending'}`}>
                          {ms.payout_status === 'paid' ? '支払い済' : '未払い'}
                        </span>
                      </td>
                      <td data-label="支払日">
                        {ms.paid_at ? new Date(ms.paid_at).toLocaleDateString('ja-JP') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dashboard.monthly_stats?.length === 0 && (
                <p className="no-data">月別実績はまだありません</p>
              )}
            </div>
          </>
        ) : (
          <p className="no-data">データを読み込めませんでした</p>
        )}
      </div>
    </div>
  );
}

export default Salesperson;
