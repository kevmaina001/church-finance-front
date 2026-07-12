import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaHome, FaFileInvoiceDollar, FaChartPie, FaClipboardList, FaChartBar, FaBook, FaTimes, FaBars, FaUsers, FaChurch } from 'react-icons/fa';

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const tenant = JSON.parse(localStorage.getItem('tenant')) || {};
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const { name: userName = 'Guest', role: userRole } = user;
  const { name: tenantName = 'Church Finance' } = tenant;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobile, sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    navigate('/login');
  };

  const menuItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/app/income', label: 'Income', icon: <FaFileInvoiceDollar /> },
    { path: '/app/expenditure', label: 'Expenditure', icon: <FaChartPie /> },
    { path: '/app/reports', label: 'Reports', icon: <FaClipboardList /> },
    { path: '/app/voteheads', label: 'Voteheads', icon: <FaClipboardList /> },
    { path: '/app/revenue-sources', label: 'Revenue Sources', icon: <FaClipboardList /> },
    { path: '/app/local-churches', label: 'Local Churches', icon: <FaChurch /> },
    { path: '/app/members', label: 'Members', icon: <FaUsers /> },
    { path: '/app/budgets', label: 'Budgets', icon: <FaChartBar /> },
    { path: '/app/visualization', label: 'Visuals', icon: <FaChartBar /> },
    { path: '/app/accounting', label: 'Accounting Reports', icon: <FaChartBar /> },
    { path: '/app/accounts', label: 'Accounts', icon: <FaBook /> },
    { path: '/app/journal-entries', label: 'Journal', icon: <FaClipboardList /> },
  ];

  if (userRole === 'Admin') {
    menuItems.push({ path: '/app/user-management', label: 'User Management', icon: <FaUsers /> });
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile Navbar with Hamburger Button */}
      {isMobile && !sidebarOpen && (
        <div className="fixed top-0 left-0 w-full h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-4 z-50">
          <button
            onClick={toggleSidebar}
            className="text-slate-700 hover:text-teal-700 rounded-lg p-2 transition duration-200"
            aria-label="Open Sidebar"
          >
            <FaBars size={24} />
          </button>
          <div className="flex-1 flex justify-center">
            <span className="font-bold text-lg text-slate-900 truncate px-4">{tenantName}</span>
          </div>
        </div>
      )}
      {/* Backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 text-slate-900 border-r border-slate-200 shadow-[12px_0_40px_rgba(15,23,42,0.04)] transform transition-transform duration-300
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        `}
        style={{ minHeight: '100vh' }}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 text-2xl z-50"
            onClick={closeSidebar}
            aria-label="Close Sidebar"
          >
            <FaTimes />
          </button>
        )}
        {/* Logo Section */}
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <FaChurch />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate text-slate-950">{tenantName}</h1>
              <p className="text-xs text-slate-500">Finance workspace</p>
            </div>
          </div>
        </div>
        <div className="flex items-center p-4 border-b border-slate-200">
          <FaUserCircle className="text-4xl text-slate-400" />
          <div className="ml-3 min-w-0">
            <h3 className="font-semibold text-base truncate">{userName}</h3>
            {userRole && <p className="text-xs text-slate-500">{userRole}</p>}
            <button
              onClick={handleLogout}
              className="text-sm text-teal-700 hover:text-teal-900 flex items-center gap-1 mt-2 transition"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
        {/* Active working context (local church / parish) */}
        <div className="mx-4 my-4 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="text-xs uppercase text-slate-500 font-semibold">Working on</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-sm flex items-center gap-2 truncate">
              <FaChurch className="flex-shrink-0 text-teal-700" />
              <span className="truncate">{activeChurch?.name || 'No context selected'}</span>
            </span>
            <button
              onClick={() => { navigate('/select-context'); if (isMobile) closeSidebar(); }}
              className="text-xs text-teal-700 hover:text-teal-900 flex-shrink-0 ml-2 font-bold"
            >
              Switch
            </button>
          </div>
        </div>
        {/* Navigation Links */}
        <nav className="flex flex-col flex-grow gap-1 px-3 pb-4 overflow-y-auto app-scrollbar" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
              onClick={() => { if (isMobile) closeSidebar(); }}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 mt-auto">
          <p className="text-xs text-slate-500 text-center">
            Financial Management System
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
