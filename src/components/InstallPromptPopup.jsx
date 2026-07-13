import React, { useEffect, useState } from 'react';
import { FaDownload, FaTimes, FaMobileAlt } from 'react-icons/fa';

// A dismissible popup that invites the user to install the app. Uses the browser's
// `beforeinstallprompt` (Android/Chrome/Edge); on iOS it shows an Add-to-Home-Screen hint.
// A dismissal is remembered for 7 days so it doesn't nag.
const DISMISS_KEY = 'installPromptDismissedAt';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const InstallPromptPopup = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return; // recently dismissed

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari never fires beforeinstallprompt — surface the banner after a short delay.
    let timer;
    if (isIOS) timer = setTimeout(() => setVisible(true), 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [isIOS]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setVisible(false);
    } else if (isIOS) {
      setShowIosHint(true);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 safe-bottom pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md app-card p-4 flex items-start gap-3 shadow-xl">
        <div className="h-11 w-11 rounded-xl bg-teal-600 flex items-center justify-center text-white flex-shrink-0">
          {isIOS ? <FaMobileAlt /> : <FaDownload />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm">Install Church Finance</p>
          <p className="text-xs text-slate-500 mt-0.5">Add it to your home screen for quick, full-screen access.</p>
          {showIosHint && (
            <p className="text-xs text-slate-600 mt-2">
              Tap the <span className="font-semibold">Share</span> icon, then choose{' '}
              <span className="font-semibold">Add to Home Screen</span>.
            </p>
          )}
          <div className="flex items-center gap-1 mt-3">
            <button onClick={install} className="app-primary-button text-xs py-2 px-4">Install</button>
            <button onClick={dismiss} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2">Not now</button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700 flex-shrink-0">
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default InstallPromptPopup;
