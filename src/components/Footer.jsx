import React from 'react';

const Footer = () => {
  const tenantName = JSON.parse(localStorage.getItem('tenant'))?.name || 'Church Finance';
  return (
    <footer className="bg-white/80 border-t border-slate-200 py-4 text-center w-full mt-auto">
      <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} <span className="font-semibold text-slate-800">{tenantName}</span>. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
