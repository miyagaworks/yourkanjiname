import React, { useState, useEffect } from 'react';
import './Admin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('calligraphy');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [poemText, setPoemText] = useState('');
  const [copied, setCopied] = useState(false);

  // Partner management state
  const [partners, setPartners] = useState([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    code: '', name: '', email: '', password: '', contact_name: '',
    phone: '', address: '', bank_name: '', bank_branch: '', bank_account: '', royalty_rate: '0.10'
  });
  const [editingPartner, setEditingPartner] = useState(null);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);

  // Payouts state
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [allPayoutStats, setAllPayoutStats] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    exchange_rate_jpy: '',
    transfer_fee_jpy: '0',
    send_email: true
  });
  const [processingPayout, setProcessingPayout] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);

  // Fetch partners
  const fetchPartners = async () => {
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/partners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.partners) {
        setPartners(data.partners);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.payments) {
        setPayments(data.payments);
        // Flatten stats for easier access
        const allTime = data.stats?.all_time || {};
        setPaymentStats({
          total_revenue: allTime.total_revenue || 0,
          partner_revenue: allTime.partner_revenue || 0,
          direct_revenue: (allTime.total_revenue || 0) - (allTime.partner_revenue || 0),
          total_payments: allTime.succeeded_count || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  // Fetch payouts
  const fetchPayouts = async () => {
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.pending_payouts) {
        setPendingPayouts(data.pending_payouts);
        setAllPayoutStats(data.all_stats || []);
        setPayoutSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'partners') fetchPartners();
    else if (tab === 'payments') fetchPayments();
    else if (tab === 'payouts') fetchPayouts();
    else if (tab === 'calligraphy') fetchRequests();
  };

  // Create partner
  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(partnerForm)
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'パートナーを作成しました' });
        setShowPartnerForm(false);
        setPartnerForm({
          code: '', name: '', email: '', password: '', contact_name: '',
          phone: '', address: '', bank_name: '', bank_branch: '', bank_account: '', royalty_rate: '0.10'
        });
        fetchPartners();
      } else {
        throw new Error(data.error?.message || 'パートナー作成に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Update partner
  const handleUpdatePartner = async (partnerId, updates) => {
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'パートナーを更新しました' });
        setEditingPartner(null);
        fetchPartners();
      } else {
        throw new Error(data.error?.message || '更新に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Delete partner
  const handleDeletePartner = async (partnerId, partnerName) => {
    if (!window.confirm(`「${partnerName}」を削除しますか？`)) return;
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'パートナーを削除しました' });
        fetchPartners();
      } else {
        throw new Error(data.error?.message || '削除に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Fetch current exchange rate from ECB
  const fetchExchangeRate = async () => {
    setFetchingRate(true);
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=JPY');
      const data = await response.json();
      if (data.rates && data.rates.JPY) {
        setPayoutForm(prev => ({
          ...prev,
          exchange_rate_jpy: data.rates.JPY.toFixed(2)
        }));
        setMessage({ type: 'success', text: `為替レート取得: $1 = ¥${data.rates.JPY.toFixed(2)}（ECB）` });
      } else {
        throw new Error('為替レートを取得できませんでした');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setFetchingRate(false);
  };

  // Fetch historical exchange rate for a specific date
  const fetchHistoricalRate = async (date) => {
    setFetchingRate(true);
    try {
      const response = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=JPY`);
      const data = await response.json();
      if (data.rates && data.rates.JPY) {
        setPayoutForm(prev => ({
          ...prev,
          exchange_rate_jpy: data.rates.JPY.toFixed(2)
        }));
        setMessage({ type: 'success', text: `${date}の為替レート取得: $1 = ¥${data.rates.JPY.toFixed(2)}（ECB）` });
      } else {
        throw new Error('為替レートを取得できませんでした');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setFetchingRate(false);
  };

  // Get last day of a month
  const getLastDayOfMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  };

  // Open payout modal
  const openPayoutModal = (payout) => {
    setSelectedPayout(payout);
    setPayoutForm({
      exchange_rate_jpy: '',
      transfer_fee_jpy: '0',
      send_email: true
    });
  };

  // Calculate payout amounts
  const calculatePayoutAmounts = () => {
    if (!selectedPayout || !payoutForm.exchange_rate_jpy) return null;
    const royaltyUsd = selectedPayout.pending_royalty;
    const exchangeRate = parseFloat(payoutForm.exchange_rate_jpy);
    const fee = parseInt(payoutForm.transfer_fee_jpy) || 0;
    const grossJpy = Math.round(royaltyUsd * exchangeRate);
    const netJpy = grossJpy - fee;
    return { royaltyUsd, exchangeRate, fee, grossJpy, netJpy };
  };

  // Process payout
  const handleProcessPayout = async () => {
    if (!selectedPayout) return;

    const amounts = calculatePayoutAmounts();
    if (!amounts || amounts.netJpy < 0) {
      setMessage({ type: 'error', text: '為替レートを正しく入力してください' });
      return;
    }

    if (amounts.netJpy < 0) {
      setMessage({ type: 'error', text: '振込手数料が振込金額を超えています' });
      return;
    }

    setProcessingPayout(true);
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: selectedPayout.partner_id,
          year_months: selectedPayout.pending_months,
          exchange_rate_jpy: parseFloat(payoutForm.exchange_rate_jpy),
          transfer_fee_jpy: parseInt(payoutForm.transfer_fee_jpy) || 0,
          send_email: payoutForm.send_email
        })
      });
      const data = await response.json();
      if (data.success) {
        const emailMsg = data.email_sent ? '（メール送信済み）' : '';
        setMessage({ type: 'success', text: `支払い完了としてマークしました${emailMsg}` });
        setSelectedPayout(null);
        fetchPayouts();
      } else {
        throw new Error(data.error?.message || '処理に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setProcessingPayout(false);
  };

  const handleCopyExplanation = async () => {
    if (!selectedRequest?.explanation_ja) {
      setMessage({ type: 'error', text: '説明文がありません' });
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedRequest.explanation_ja);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'コピーに失敗しました' });
    }
  };

  const handleDelete = async (requestId, kanjiName) => {
    if (!window.confirm(`「${kanjiName}」の申込を削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '削除しました' });
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
          setUploadFile(null);
        }
        fetchRequests();
      } else {
        throw new Error(data.error?.message || '削除に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Reset body background for admin page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
  }, []);

  // Check session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
      setIsLoggedIn(true);
      fetchRequests();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('adminSession', data.token);
        setIsLoggedIn(true);
        fetchRequests();
      } else {
        setLoginError('パスワードが正しくありません');
      }
    } catch (error) {
      setLoginError('ログインに失敗しました');
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminSession');
      const response = await fetch(`${API_BASE_URL}/admin/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
    } else {
      setMessage({ type: 'error', text: '画像ファイルを選択してください' });
    }
  };

  const handleUploadAndSend = async () => {
    if (!selectedRequest || !uploadFile) {
      setMessage({ type: 'error', text: '申込と画像を選択してください' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = sessionStorage.getItem('adminSession');

      // Upload image to R2
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('requestId', selectedRequest.id);

      const uploadResponse = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error?.message || 'アップロードに失敗しました');
      }

      setUploading(false);
      setSendingEmail(true);

      // Send email with the image
      const sendResponse = await fetch(`${API_BASE_URL}/admin/send-calligraphy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          imageUrl: uploadData.imageUrl,
          poemText: poemText
        })
      });

      const sendData = await sendResponse.json();

      if (sendData.success) {
        setMessage({ type: 'success', text: 'メールを送信しました！' });
        setSelectedRequest(null);
        setUploadFile(null);
        setPoemText('');
        fetchRequests(); // Refresh list
      } else {
        throw new Error(sendData.error?.message || 'メール送信に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }

    setUploading(false);
    setSendingEmail(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminSession');
    setIsLoggedIn(false);
    setRequests([]);
  };

  const getLanguageName = (code) => {
    const names = {
      ja: '日本語',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      it: 'Italiano',
      th: 'ไทย',
      vi: 'Tiếng Việt',
      id: 'Indonesia',
      ko: '한국어'
    };
    return names[code] || code;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '未対応', class: 'status-pending' },
      sent: { label: '送信済', class: 'status-sent' },
      completed: { label: '完了', class: 'status-completed' }
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h1>管理者ログイン</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              autoFocus
            />
            <button type="submit">ログイン</button>
          </form>
          {loginError && <p className="error">{loginError}</p>}
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>管理画面</h1>
        <nav className="admin-tabs">
          <button
            className={activeTab === 'calligraphy' ? 'active' : ''}
            onClick={() => handleTabChange('calligraphy')}
          >
            書道申込
          </button>
          <button
            className={activeTab === 'partners' ? 'active' : ''}
            onClick={() => handleTabChange('partners')}
          >
            パートナー
          </button>
          <button
            className={activeTab === 'payments' ? 'active' : ''}
            onClick={() => handleTabChange('payments')}
          >
            決済
          </button>
          <button
            className={activeTab === 'payouts' ? 'active' : ''}
            onClick={() => handleTabChange('payouts')}
          >
            支払い
          </button>
        </nav>
        <button onClick={handleLogout} className="logout-btn">ログアウト</button>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-content">
        {/* Calligraphy Tab */}
        {activeTab === 'calligraphy' && (
        <>
        <div className="requests-list">
          <h2>申込一覧 ({requests.filter(r => r.status === 'pending').length}件未対応)</h2>

          {loading ? (
            <p>読み込み中...</p>
          ) : requests.length === 0 ? (
            <p>申込はありません</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>名前</th>
                  <th>漢字名</th>
                  <th>言語</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className={selectedRequest?.id === req.id ? 'selected' : ''}>
                    <td data-label="日時">{new Date(req.created_at).toLocaleString('ja-JP')}</td>
                    <td data-label="名前">{req.user_name || '-'}</td>
                    <td data-label="漢字名" className="kanji-cell">{req.kanji_name}</td>
                    <td data-label="言語">{getLanguageName(req.language)}</td>
                    <td data-label="状態">{getStatusBadge(req.status)}</td>
                    <td className="action-cell">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="select-btn"
                        >
                          選択
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(req.id, req.kanji_name)}
                        className="delete-btn"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedRequest && (
          <div className="send-panel">
            <h2>書道画像送信</h2>

            <div className="request-detail">
              <p><strong>宛先:</strong> {selectedRequest.email}</p>
              <p><strong>名前:</strong> {selectedRequest.user_name || '(未入力)'}</p>
              <p><strong>漢字名:</strong> <span className="kanji-large">{selectedRequest.kanji_name}</span></p>
              <p><strong>言語:</strong> {getLanguageName(selectedRequest.language)}</p>
            </div>

            <div className="upload-section">
              <label>書道画像を選択:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {uploadFile && (
                <div className="preview">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                  />
                </div>
              )}
            </div>

            <div className="template-copy-section">
              <button
                onClick={handleCopyExplanation}
                className="template-copy-btn"
                disabled={!selectedRequest?.explanation_ja}
              >
                {copied ? 'コピーしました！' : '日本語説明文をコピー'}
              </button>
            </div>

            <div className="poem-template-section">
              <label>折句説明文</label>
              <textarea
                value={poemText}
                onChange={(e) => setPoemText(e.target.value)}
                className="poem-template-textarea"
                placeholder="ここに折句の説明文をペーストしてください"
              />
            </div>

            <div className="action-buttons">
              <button
                onClick={handleUploadAndSend}
                disabled={!uploadFile || uploading || sendingEmail}
                className="send-btn"
              >
                {uploading ? 'アップロード中...' : sendingEmail ? 'メール送信中...' : '送信する'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setUploadFile(null);
                }}
                className="cancel-btn"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
        </>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="partners-section">
            <div className="section-header">
              <h2>パートナー一覧 ({partners.length}件)</h2>
              <button onClick={() => setShowPartnerForm(true)} className="add-btn">
                + 新規パートナー
              </button>
            </div>

            {showPartnerForm && (
              <div className="partner-form-overlay">
                <div className="partner-form">
                  <h3>新規パートナー作成</h3>
                  <form onSubmit={handleCreatePartner}>
                    <div className="form-row">
                      <label>コード (URL用)</label>
                      <input
                        type="text"
                        value={partnerForm.code}
                        onChange={(e) => setPartnerForm({...partnerForm, code: e.target.value})}
                        placeholder="例: hiroshima-okonomiyaki"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>店舗名</label>
                      <input
                        type="text"
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                        placeholder="例: お好み焼き○○"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>メールアドレス</label>
                      <input
                        type="email"
                        value={partnerForm.email}
                        onChange={(e) => setPartnerForm({...partnerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>パスワード</label>
                      <input
                        type="password"
                        value={partnerForm.password}
                        onChange={(e) => setPartnerForm({...partnerForm, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>担当者名</label>
                      <input
                        type="text"
                        value={partnerForm.contact_name}
                        onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>電話番号</label>
                      <input
                        type="tel"
                        value={partnerForm.phone}
                        onChange={(e) => setPartnerForm({...partnerForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>住所</label>
                      <input
                        type="text"
                        value={partnerForm.address}
                        onChange={(e) => setPartnerForm({...partnerForm, address: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>銀行名</label>
                      <input
                        type="text"
                        value={partnerForm.bank_name}
                        onChange={(e) => setPartnerForm({...partnerForm, bank_name: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>支店名</label>
                      <input
                        type="text"
                        value={partnerForm.bank_branch}
                        onChange={(e) => setPartnerForm({...partnerForm, bank_branch: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>口座番号</label>
                      <input
                        type="text"
                        value={partnerForm.bank_account}
                        onChange={(e) => setPartnerForm({...partnerForm, bank_account: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>ロイヤリティ率</label>
                      <select
                        value={partnerForm.royalty_rate}
                        onChange={(e) => setPartnerForm({...partnerForm, royalty_rate: e.target.value})}
                      >
                        <option value="0.05">5%</option>
                        <option value="0.10">10%</option>
                        <option value="0.15">15%</option>
                        <option value="0.20">20%</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">作成</button>
                      <button type="button" onClick={() => setShowPartnerForm(false)} className="cancel-btn">
                        キャンセル
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <table className="partners-table">
              <thead>
                <tr>
                  <th>コード</th>
                  <th>店舗名</th>
                  <th>メール</th>
                  <th>ロイヤリティ率</th>
                  <th>総売上</th>
                  <th>未払い</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id}>
                    <td data-label="コード"><code>{p.code}</code></td>
                    <td data-label="店舗名">{p.name}</td>
                    <td data-label="メール">{p.email}</td>
                    <td data-label="率">{(p.royalty_rate * 100).toFixed(0)}%</td>
                    <td data-label="総売上">${p.total_revenue?.toFixed(2) || '0.00'}</td>
                    <td data-label="未払い" className="pending-amount">${p.pending_royalty?.toFixed(2) || '0.00'}</td>
                    <td data-label="状態">
                      <span className={`status-badge status-${p.status}`}>
                        {p.status === 'active' ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        onClick={() => setEditingPartner({
                          ...p,
                          royalty_rate: parseFloat(p.royalty_rate).toFixed(2)
                        })}
                        className="edit-btn"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeletePartner(p.id, p.name)}
                        className="delete-btn"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {editingPartner && (
              <div className="partner-form-overlay">
                <div className="partner-form">
                  <h3>パートナー編集: {editingPartner.name}</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const updates = {
                      name: editingPartner.name,
                      email: editingPartner.email,
                      contact_name: editingPartner.contact_name,
                      phone: editingPartner.phone,
                      address: editingPartner.address,
                      bank_name: editingPartner.bank_name,
                      bank_branch: editingPartner.bank_branch,
                      bank_account: editingPartner.bank_account,
                      royalty_rate: editingPartner.royalty_rate,
                      status: editingPartner.status
                    };
                    if (editingPartner.new_password) {
                      updates.password = editingPartner.new_password;
                    }
                    handleUpdatePartner(editingPartner.id, updates);
                  }}>
                    <div className="form-row">
                      <label>店舗名</label>
                      <input
                        type="text"
                        value={editingPartner.name}
                        onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>メールアドレス</label>
                      <input
                        type="email"
                        value={editingPartner.email}
                        onChange={(e) => setEditingPartner({...editingPartner, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>担当者名</label>
                      <input
                        type="text"
                        value={editingPartner.contact_name || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, contact_name: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>電話番号</label>
                      <input
                        type="tel"
                        value={editingPartner.phone || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, phone: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>住所</label>
                      <input
                        type="text"
                        value={editingPartner.address || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, address: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>銀行名</label>
                      <input
                        type="text"
                        value={editingPartner.bank_name || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, bank_name: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>支店名</label>
                      <input
                        type="text"
                        value={editingPartner.bank_branch || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, bank_branch: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>口座番号</label>
                      <input
                        type="text"
                        value={editingPartner.bank_account || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, bank_account: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>ロイヤリティ率</label>
                      <select
                        value={editingPartner.royalty_rate}
                        onChange={(e) => setEditingPartner({...editingPartner, royalty_rate: e.target.value})}
                      >
                        <option value="0.05">5%</option>
                        <option value="0.10">10%</option>
                        <option value="0.15">15%</option>
                        <option value="0.20">20%</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label>パスワードリセット</label>
                      <input
                        type="text"
                        value={editingPartner.new_password || ''}
                        onChange={(e) => setEditingPartner({...editingPartner, new_password: e.target.value})}
                        placeholder="新しいパスワードを入力（変更する場合のみ）"
                      />
                      <small className="form-hint">空欄の場合は変更されません</small>
                    </div>
                    <div className="form-row">
                      <label>状態</label>
                      <select
                        value={editingPartner.status}
                        onChange={(e) => setEditingPartner({...editingPartner, status: e.target.value})}
                      >
                        <option value="active">有効</option>
                        <option value="inactive">無効</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">更新</button>
                      <button type="button" onClick={() => setEditingPartner(null)} className="cancel-btn">
                        キャンセル
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="payments-section">
            <h2>決済一覧</h2>

            {paymentStats && (
              <div className="payment-stats">
                <div className="stat-card">
                  <div className="stat-label">総売上</div>
                  <div className="stat-value">${paymentStats.total_revenue?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">パートナー経由</div>
                  <div className="stat-value">${paymentStats.partner_revenue?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">直接</div>
                  <div className="stat-value">${paymentStats.direct_revenue?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">決済数</div>
                  <div className="stat-value">{paymentStats.total_payments || 0}</div>
                </div>
              </div>
            )}

            <table className="payments-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>漢字名</th>
                  <th>金額</th>
                  <th>パートナー</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td data-label="日時">{new Date(p.created_at).toLocaleString('ja-JP')}</td>
                    <td data-label="漢字名" className="kanji-cell">{p.kanji_name || '-'}</td>
                    <td data-label="金額">${p.amount?.toFixed(2)}</td>
                    <td data-label="パートナー">{p.partner_name || <span className="muted">直接</span>}</td>
                    <td data-label="状態">
                      <span className={`status-badge status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="payouts-section">
            <h2>支払い管理</h2>

            {payoutSummary && (
              <div className="payout-summary">
                <div className="stat-card highlight">
                  <div className="stat-label">未払い総額</div>
                  <div className="stat-value">${payoutSummary.total_pending?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">支払い済み総額</div>
                  <div className="stat-value">${payoutSummary.total_paid?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">対象パートナー数</div>
                  <div className="stat-value">{payoutSummary.partners_pending || 0}</div>
                </div>
              </div>
            )}

            <h3>未払いパートナー</h3>
            <table className="payouts-table">
              <thead>
                <tr>
                  <th>パートナー</th>
                  <th>対象月</th>
                  <th>決済数</th>
                  <th>売上</th>
                  <th>ロイヤリティ</th>
                  <th>振込先</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.map(p => (
                  <tr key={p.partner_id}>
                    <td data-label="パートナー">
                      <strong>{p.name}</strong>
                      <br />
                      <small className="muted">{p.code}</small>
                    </td>
                    <td data-label="対象月">{p.pending_months?.join(', ') || '-'}</td>
                    <td data-label="決済数">{p.total_payments}</td>
                    <td data-label="売上">${p.total_revenue?.toFixed(2)}</td>
                    <td data-label="ロイヤリティ" className="royalty-amount">${p.pending_royalty?.toFixed(2)}</td>
                    <td data-label="振込先" className="bank-info">
                      {p.bank_name ? (
                        <span>
                          {p.bank_name}
                          {p.bank_branch && <><br />{p.bank_branch}</>}
                          {p.bank_account && <><br />{p.bank_account}</>}
                        </span>
                      ) : (
                        <span className="muted">未設定</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => openPayoutModal(p)}
                        className="paid-btn"
                        disabled={!p.bank_name || !p.bank_account}
                      >
                        支払い処理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pendingPayouts.length === 0 && (
              <p className="no-data">未払いの支払いはありません</p>
            )}

            {/* Payout History */}
            <h3 style={{ marginTop: '40px' }}>支払い履歴</h3>
            <table className="payouts-table">
              <thead>
                <tr>
                  <th>パートナー</th>
                  <th>対象月</th>
                  <th>ロイヤリティ</th>
                  <th>為替レート</th>
                  <th>振込手数料</th>
                  <th>振込金額</th>
                  <th>支払日</th>
                </tr>
              </thead>
              <tbody>
                {allPayoutStats.filter(s => s.payout_status === 'paid').map(s => (
                  <tr key={s.id}>
                    <td data-label="パートナー">{s.partner_name}</td>
                    <td data-label="対象月">{s.year_month}</td>
                    <td data-label="ロイヤリティ">${s.royalty_amount?.toFixed(2)}</td>
                    <td data-label="為替">{s.exchange_rate_jpy ? `¥${s.exchange_rate_jpy.toFixed(2)}` : '-'}</td>
                    <td data-label="手数料">¥{s.transfer_fee_jpy?.toLocaleString() || '0'}</td>
                    <td data-label="振込額" className="royalty-amount">¥{s.net_payout_jpy?.toLocaleString() || '-'}</td>
                    <td data-label="支払日">{s.paid_at ? new Date(s.paid_at).toLocaleDateString('ja-JP') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {allPayoutStats.filter(s => s.payout_status === 'paid').length === 0 && (
              <p className="no-data">支払い履歴はありません</p>
            )}

            {/* Payout Modal */}
            {selectedPayout && (
              <div className="partner-form-overlay">
                <div className="partner-form payout-modal">
                  <h3>支払い処理</h3>

                  <div className="payout-partner-info">
                    <h4>{selectedPayout.name}</h4>
                    <p className="muted">{selectedPayout.email}</p>
                  </div>

                  <div className="payout-bank-info">
                    <h4>振込先</h4>
                    <p>
                      <strong>{selectedPayout.bank_name}</strong>
                      {selectedPayout.bank_branch && <><br />{selectedPayout.bank_branch}</>}
                      <br />{selectedPayout.bank_account}
                    </p>
                  </div>

                  <div className="payout-details">
                    <h4>支払い内容</h4>
                    <div className="payout-detail-row">
                      <span>対象月:</span>
                      <span>{selectedPayout.pending_months?.join(', ')}</span>
                    </div>
                    <div className="payout-detail-row">
                      <span>決済数:</span>
                      <span>{selectedPayout.total_payments}件</span>
                    </div>
                    <div className="payout-detail-row">
                      <span>ロイヤリティ (USD):</span>
                      <span className="highlight-amount">${selectedPayout.pending_royalty?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="payout-form">
                    <div className="form-row">
                      <label>為替レート (USD/JPY) *</label>
                      <div className="exchange-rate-input-group">
                        <input
                          type="number"
                          step="0.01"
                          value={payoutForm.exchange_rate_jpy}
                          onChange={(e) => setPayoutForm({...payoutForm, exchange_rate_jpy: e.target.value})}
                          placeholder="例: 150.00"
                          required
                        />
                        <div className="rate-buttons">
                          {selectedPayout.pending_months?.map(month => (
                            <button
                              key={month}
                              type="button"
                              onClick={() => fetchHistoricalRate(getLastDayOfMonth(month))}
                              disabled={fetchingRate}
                              className="fetch-rate-btn"
                            >
                              {month}月末
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={fetchExchangeRate}
                            disabled={fetchingRate}
                            className="fetch-rate-btn current"
                          >
                            {fetchingRate ? '取得中...' : '現在'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <label>振込手数料 (円)</label>
                      <input
                        type="number"
                        value={payoutForm.transfer_fee_jpy}
                        onChange={(e) => setPayoutForm({...payoutForm, transfer_fee_jpy: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-row checkbox-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={payoutForm.send_email}
                          onChange={(e) => setPayoutForm({...payoutForm, send_email: e.target.checked})}
                        />
                        パートナーにメール通知を送信
                      </label>
                    </div>
                  </div>

                  {payoutForm.exchange_rate_jpy && (
                    <div className="payout-calculation">
                      <h4>振込金額計算</h4>
                      {(() => {
                        const amounts = calculatePayoutAmounts();
                        if (!amounts) return null;
                        return (
                          <>
                            <div className="payout-detail-row">
                              <span>円換算額:</span>
                              <span>¥{amounts.grossJpy.toLocaleString()}</span>
                            </div>
                            <div className="payout-detail-row">
                              <span>振込手数料:</span>
                              <span>-¥{amounts.fee.toLocaleString()}</span>
                            </div>
                            <div className="payout-detail-row total">
                              <span>お振込金額:</span>
                              <span className={amounts.netJpy < 0 ? 'error' : 'highlight-amount'}>
                                ¥{amounts.netJpy.toLocaleString()}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      onClick={handleProcessPayout}
                      disabled={!payoutForm.exchange_rate_jpy || processingPayout}
                      className="submit-btn"
                    >
                      {processingPayout ? '処理中...' : '支払い完了として記録'}
                    </button>
                    <button
                      onClick={() => setSelectedPayout(null)}
                      className="cancel-btn"
                      disabled={processingPayout}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
