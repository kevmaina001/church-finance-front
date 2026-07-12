import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaHome, FaFileInvoiceDollar, FaChartPie, FaClipboardList, FaChevronDown, FaChartBar, FaBook, FaTimes, FaBars, FaTachometerAlt, FaMoneyBillWave, FaListAlt, FaUsers, FaChurch } from 'react-icons/fa';
import API from '../utils/apiConfig';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true); // Sidebar toggle state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For overlay sidebar
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const tenant = JSON.parse(localStorage.getItem('tenant')) || {};
  const { name: userName = 'Guest', role: userRole } = user;
  const { name: tenantName = 'Church Finance' } = tenant;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
        setCollapsed(false); // Ensure sidebar is expanded on desktop
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
    { path: '/app/visualization', label: 'Visuals', icon: <FaChartBar /> },
    { path: '/app/accounting', label: 'Accounting', icon: <FaBook /> },
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
        <div className="fixed top-0 left-0 w-full h-16 bg-white shadow flex items-center px-4 z-50">
          <button
            onClick={toggleSidebar}
            className="text-teal-700 hover:text-teal-500 rounded-full p-2 focus:outline-none transition duration-300"
            aria-label="Open Sidebar"
          >
            <FaBars size={24} />
          </button>
          <div className="flex-1 flex justify-center">
            <span className="font-bold text-lg text-teal-700">ACK Kamune</span>
          </div>
        </div>
      )}
      {/* Backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={closeSidebar}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-teal-700 to-indigo-900 z-50 text-white shadow-lg transform transition-transform duration-300
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        `}
        style={{ minHeight: '100vh' }}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            className="absolute top-3 right-3 text-white text-2xl z-50"
            onClick={closeSidebar}
            aria-label="Close Sidebar"
          >
            <FaTimes />
          </button>
        )}
        {/* Logo Section */}
        <div className="flex items-center justify-center py-6 border-b border-indigo-700">
          <h1 className="text-2xl font-extrabold tracking-wide">{tenantName}</h1>
        </div>
        {/* User Info Section */}
        <div className="flex items-center p-4 border-b border-indigo-700">
          <FaUserCircle className="text-4xl" />
          <div className="ml-3">
            <h3 className="font-semibold text-lg">{userName}</h3>
            <button
              onClick={handleLogout}
              className="text-sm text-teal-300 hover:text-teal-500 flex items-center space-x-1 mt-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
        {/* Navigation Links */}
        <nav className="flex flex-col flex-grow space-y-2 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 py-3 px-4 rounded-lg ${
                location.pathname === item.path
                  ? 'bg-teal-600 shadow-lg'
                  : 'hover:bg-teal-500 hover:shadow-md'
              } transition-all duration-200`}
              onClick={() => { if (isMobile) closeSidebar(); }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          <NavLink to="/app/accounting" className={({ isActive }) => isActive ? "bg-gray-700 block py-2 px-4" : "block py-2 px-4 hover:bg-gray-700"}>
            <FaChartBar className="inline-block mr-2" /> Accounting Reports
          </NavLink>
        </nav>
        {/* Footer Section */}
        <div className="p-4 border-t border-indigo-700 mt-auto">
          <p className="text-sm text-teal-300 text-center">
            Financial Management System
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
