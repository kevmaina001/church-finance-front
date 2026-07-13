import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; // Sidebar replaces Navbar
import Footer from '../components/Footer';
import InstallPromptPopup from '../components/InstallPromptPopup';

const MainLayout = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
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
