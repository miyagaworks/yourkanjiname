import React, { useState, useEffect } from 'react';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';

function Partner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null);

  // Reset body styles for partner page
  useEffect(() => {
    document.body.style.setProperty('background-image', 'none', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('display', 'block', 'important');
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
    // Scroll to top after state update
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
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
