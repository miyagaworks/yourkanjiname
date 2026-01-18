import React, { useState, useEffect } from 'react';
import './Admin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [poemText, setPoemText] = useState('');
  const [copied, setCopied] = useState(false);

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
        <h1>書道申込管理</h1>
        <button onClick={handleLogout} className="logout-btn">ログアウト</button>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-content">
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
                    <td>{new Date(req.created_at).toLocaleString('ja-JP')}</td>
                    <td>{req.user_name || '-'}</td>
                    <td className="kanji-cell">{req.kanji_name}</td>
                    <td>{getLanguageName(req.language)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="select-btn"
                        >
                          選択
                        </button>
                      )}
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
      </div>
    </div>
  );
}

export default Admin;
