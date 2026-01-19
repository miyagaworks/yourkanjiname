import React, { useState, useEffect } from 'react';
import './PartnerDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function PartnerDashboard({ partner, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      setError(err.message || 'Failed to load dashboard');
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
      alert('Copied to clipboard!');
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="partner-dashboard loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-dashboard error-state">
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  const { stats, monthly_history, recent_payments, qr_code_url } = dashboardData;

  return (
    <div className="partner-dashboard">
      <header className="partner-header">
        <div className="header-left">
          <img src="/images/logo_color.svg" alt="Your Kanji Name" className="header-logo" />
          <div className="header-info">
            <h1>Partner Dashboard</h1>
            <p>Welcome, {partner.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <nav className="partner-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={activeTab === 'qrcode' ? 'active' : ''}
          onClick={() => setActiveTab('qrcode')}
        >
          QR Code
        </button>
      </nav>

      <main className="partner-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-label">Pending Royalty</div>
                <div className="stat-value">{formatCurrency(stats.pending_royalty)}</div>
                <div className="stat-note">Available for payout</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">This Month</div>
                <div className="stat-value">{formatCurrency(stats.current_month.royalty)}</div>
                <div className="stat-note">{stats.current_month.payments} payments</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">All Time Revenue</div>
                <div className="stat-value">{formatCurrency(stats.all_time.revenue)}</div>
                <div className="stat-note">{stats.all_time.payments} total payments</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Total Royalty Earned</div>
                <div className="stat-value">{formatCurrency(stats.all_time.royalty)}</div>
                <div className="stat-note">{(dashboardData.partner.royalty_rate * 100).toFixed(0)}% rate</div>
              </div>
            </div>

            <div className="recent-section">
              <h2>Recent Payments</h2>
              {recent_payments.length === 0 ? (
                <p className="no-data">No payments yet. Share your QR code to start earning!</p>
              ) : (
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Kanji Name</th>
                      <th>Amount</th>
                      <th>Royalty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.created_at)}</td>
                        <td className="kanji">{payment.kanji_name || '-'}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{formatCurrency(payment.amount * dashboardData.partner.royalty_rate)}</td>
                        <td>
                          <span className={`status-badge status-${payment.status}`}>
                            {payment.status}
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
            <h2>Monthly History</h2>
            {monthly_history.length === 0 ? (
              <p className="no-data">No history yet.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payments</th>
                    <th>Revenue</th>
                    <th>Royalty</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly_history.map((row) => (
                    <tr key={row.year_month}>
                      <td>{row.year_month}</td>
                      <td>{row.payments}</td>
                      <td>{formatCurrency(row.revenue)}</td>
                      <td>{formatCurrency(row.royalty)}</td>
                      <td>
                        <span className={`payout-badge payout-${row.payout_status}`}>
                          {row.payout_status}
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
              <h2>Your Affiliate Link</h2>
              <p>Share this link or QR code with your customers. When they complete a purchase, you'll earn {(dashboardData.partner.royalty_rate * 100).toFixed(0)}% royalty!</p>

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
                  Copy
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
                  download="yourkanjiname-qr.png"
                  className="download-btn"
                >
                  Download QR Code (PNG)
                </a>
              </div>

              <div className="partner-code-info">
                <p>Your partner code: <strong>{partner.code}</strong></p>
                <p>Customers can also access your link by adding <code>?ref={partner.code}</code> to the website URL.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PartnerDashboard;
