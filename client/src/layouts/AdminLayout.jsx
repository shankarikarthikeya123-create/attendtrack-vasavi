import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Derive page title from path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Admin Dashboard';
    if (pathname.includes('/workers')) return 'Worker Management';
    if (pathname.includes('/sites')) return 'Construction Sites';
    if (pathname.includes('/supervisors')) return 'Site Supervisors';
    if (pathname.includes('/mark-attendance')) return 'Mark Worker Attendance';
    if (pathname.includes('/attendance-records')) return 'Attendance Logs';
    if (pathname.includes('/reports')) return 'Monthly Attendance & Wages Report';
    return 'AttendTrack - Vasavi';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bgMain">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Topbar toggleSidebar={toggleSidebar} title={getPageTitle(location.pathname)} />
        
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
