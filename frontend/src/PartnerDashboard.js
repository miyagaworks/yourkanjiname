import React, { useState, useEffect } from 'react';
import './PartnerDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function PartnerDashboard({ partner, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Reset body styles for partner dashboard
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('display', 'block', 'important');
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('partnerToken');
      const response = await fetch(`${API_BASE_URL}/partner/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'ダッシュボードの読み込みに失敗しました');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('partnerToken');
    sessionStorage.removeItem('partnerInfo');
    onLogout();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('コピーしました');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatJPY = (usdAmount) => {
    if (!dashboardData?.exchange_rate?.usd_jpy) return '';
    const jpyAmount = usdAmount * dashboardData.exchange_rate.usd_jpy;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(jpyAmount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      succeeded: '完了',
      pending: '処理中',
      failed: '失敗'
    };
    return labels[status] || status;
  };

  const getPayoutStatusLabel = (status) => {
    const labels = {
      pending: '未払い',
      paid: '支払済'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="partner-dashboard loading-state">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-dashboard error-state">
        <p>{error}</p>
        <button onClick={fetchDashboardData}>再試行</button>
      </div>
    );
  }

  const { stats, monthly_history, recent_payments, qr_code_url, exchange_rate } = dashboardData;

  return (
    <div className="partner-dashboard">
      <header className="partner-header">
        <div className="header-info">
          <h1>パートナーダッシュボード</h1>
          <p>{partner.name} 様</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">ログアウト</button>
      </header>

      <nav className="partner-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          概要
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          履歴
        </button>
        <button
          className={activeTab === 'qrcode' ? 'active' : ''}
          onClick={() => setActiveTab('qrcode')}
        >
          QRコード
        </button>
      </nav>

      <main className="partner-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-label">未払いロイヤリティ</div>
                <div className="stat-value">{formatJPY(stats.pending_royalty)}</div>
                <div className="stat-note">{formatCurrency(stats.pending_royalty)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">今月</div>
                <div className="stat-value">{formatJPY(stats.current_month.royalty)}</div>
                <div className="stat-note">{stats.current_month.payments}件</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">累計売上</div>
                <div className="stat-value">{formatJPY(stats.all_time.revenue)}</div>
                <div className="stat-note">合計{stats.all_time.payments}件</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">累計ロイヤリティ</div>
                <div className="stat-value">{formatJPY(stats.all_time.royalty)}</div>
                <div className="stat-note">還元率 {(dashboardData.partner.royalty_rate * 100).toFixed(0)}%</div>
              </div>
            </div>

            {exchange_rate && (
              <div className="exchange-rate-info">
                為替レート: $1 = ¥{exchange_rate.usd_jpy.toFixed(2)}（{exchange_rate.source}）
              </div>
            )}

            <div className="recent-section">
              <h2>最近の決済</h2>
              {recent_payments.length === 0 ? (
                <p className="no-data">まだ決済がありません。QRコードを共有して収益を獲得しましょう！</p>
              ) : (
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>日付</th>
                      <th>漢字名</th>
                      <th>金額</th>
                      <th>ロイヤリティ</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.created_at)}</td>
                        <td className="kanji">{payment.kanji_name || '-'}</td>
                        <td>{formatJPY(payment.amount)}</td>
                        <td>{formatJPY(payment.amount * dashboardData.partner.royalty_rate)}</td>
                        <td>
                          <span className={`status-badge status-${payment.status}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h2>月別履歴</h2>
            {monthly_history.length === 0 ? (
              <p className="no-data">まだ履歴がありません。</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>月</th>
                    <th>件数</th>
                    <th>売上</th>
                    <th>ロイヤリティ</th>
                    <th>状態</th>
                    <th>支払日</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly_history.map((row) => (
                    <tr key={row.year_month}>
                      <td>{row.year_month}</td>
                      <td>{row.payments}</td>
                      <td>{formatJPY(row.revenue)}</td>
                      <td>{formatJPY(row.royalty)}</td>
                      <td>
                        <span className={`payout-badge payout-${row.payout_status}`}>
                          {getPayoutStatusLabel(row.payout_status)}
                        </span>
                      </td>
                      <td>{row.paid_at ? formatDate(row.paid_at) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'qrcode' && (
          <div className="qrcode-tab">
            <div className="qrcode-card">
              <h2>アフィリエイトリンク</h2>
              <p>このリンクまたはQRコードをお客様に共有してください。お客様が購入を完了すると、{(dashboardData.partner.royalty_rate * 100).toFixed(0)}%のロイヤリティが獲得できます！</p>

              <div className="affiliate-link-box">
                <input
                  type="text"
                  value={qr_code_url}
                  readOnly
                  className="affiliate-link-input"
                />
                <button
                  onClick={() => copyToClipboard(qr_code_url)}
                  className="copy-btn"
                >
                  コピー
                </button>
              </div>

              <div className="qrcode-display">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr_code_url)}`}
                  alt="QR Code"
                  className="qrcode-image"
                />
              </div>

              <div className="qrcode-actions">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr_code_url)}&format=png`}
                  download="kanjiname-qr.png"
                  className="download-btn"
                >
                  QRコードをダウンロード (PNG)
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PartnerDashboard;
