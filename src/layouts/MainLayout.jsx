import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; // Sidebar replaces Navbar
import Footer from '../components/Footer';
import InstallPromptPopup from '../components/InstallPromptPopup';
import { isSessionExpired, getTokenExpiry, endSession } from '../utils/session';

// setTimeout overflows past this and fires immediately, so never exceed it.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

const MainLayout = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    const checkSession = () => {
      if (isSessionExpired()) endSession();
    };
    checkSession();

    // Sign out the moment the token lapses rather than on the next failed request.
    const expiresAt = getTokenExpiry();
    const timer = expiresAt
      ? setTimeout(checkSession, Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMEOUT_MS))
      : null;
    // Timers don't fire reliably while a phone is asleep, so re-check on refocus too.
    document.addEventListener('visibilitychange', checkSession);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', checkSession);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-slate-900">
      <Sidebar />

      <main className="flex-1 w-full overflow-x-hidden flex flex-col">
        <div className="flex-1 w-full ml-0 md:ml-72 md:w-[calc(100vw-18rem)] px-4 sm:px-6 xl:px-8 py-6 pt-20 md:pt-6 safe-bottom">
          <Outlet />
        </div>
        <Footer />
      </main>
      <InstallPromptPopup />
    </div>
  );
};

export default MainLayout;
