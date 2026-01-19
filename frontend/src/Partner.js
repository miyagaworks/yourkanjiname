import React, { useState, useEffect } from 'react';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';

function Partner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null);

  // Reset body background for partner page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
  }, []);

  // Check for existing session
  useEffect(() => {
    const token = sessionStorage.getItem('partnerToken');
    const storedInfo = sessionStorage.getItem('partnerInfo');

    if (token && storedInfo) {
      try {
        const info = JSON.parse(storedInfo);
        setPartnerInfo(info);
        setIsLoggedIn(true);
      } catch (err) {
        // Invalid stored data, clear it
        sessionStorage.removeItem('partnerToken');
        sessionStorage.removeItem('partnerInfo');
      }
    }
  }, []);

  const handleLogin = (partner) => {
    setPartnerInfo(partner);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setPartnerInfo(null);
    setIsLoggedIn(false);
  };

  if (isLoggedIn && partnerInfo) {
    return <PartnerDashboard partner={partnerInfo} onLogout={handleLogout} />;
  }

  return <PartnerLogin onLogin={handleLogin} />;
}

export default Partner;
