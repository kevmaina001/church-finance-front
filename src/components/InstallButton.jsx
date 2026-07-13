import React, { useEffect, useState } from 'react';
import { FaDownload, FaMobileAlt } from 'react-icons/fa';

// Shows an "Install app" button when the browser offers installation (Android/Chrome/Edge
// fire `beforeinstallprompt`). iOS Safari doesn't, so we show a short Add-to-Home-Screen hint.
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHint, setShowIosHint] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Already installed, or nothing to offer (a non-iOS browser that never fired the event)
  if (installed) return null;
  if (!deferredPrompt && !isIOS) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosHint((v) => !v);
    }
  };

  return (
    <div className="px-3 pb-2">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold text-teal-800 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition"
      >
        {isIOS ? <FaMobileAlt /> : <FaDownload />}
        <span>Install app</span>
      </button>
      {showIosHint && (
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Tap the <span className="font-semibold">Share</span> icon in Safari, then choose{' '}
          <span className="font-semibold">Add to Home Screen</span>.
        </p>
      )}
    </div>
  );
};

export default InstallButton;
