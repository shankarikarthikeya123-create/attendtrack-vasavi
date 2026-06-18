import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

const SupervisorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Derive page title from path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Supervisor Dashboard';
    if (pathname.includes('/mark-attendance')) return 'Mark Today\'s Attendance';
    if (pathname.includes('/history')) return 'Site Attendance History';
    if (pathname.includes('/report')) return 'Monthly Site Report';
    return 'Supervisor Console';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bgMain">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Topbar toggleSidebar={toggleSidebar} title={getPageTitle(location.pathname)} />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupervisorLayout;
