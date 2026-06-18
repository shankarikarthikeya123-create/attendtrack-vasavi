import React, { useState } from 'react';
import { Menu, LogOut, Key, User } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const Topbar = ({ toggleSidebar, title = 'AttendTrack' }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-sm">
      {/* Left side: Hamburger (mobile) & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-1 -ml-1 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          aria-label="Open Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-brand-navy truncate">{title}</h2>
          <span className="hidden sm:inline-block text-xs text-brand-textLight font-medium">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Right side: Supervisor Site context and Profile menu */}
      <div className="flex items-center space-x-4">
        {user.role === 'SUPERVISOR' && user.siteName && (
          <div className="hidden md:flex flex-col items-end px-3 py-1 bg-brand-skyBg text-brand-navyDark rounded-lg text-xs font-semibold border border-brand-sky/20">
            <span className="text-[10px] text-brand-textLight uppercase tracking-wider font-bold">Assigned Site</span>
            <span>{user.siteName}</span>
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 focus:outline-none transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-brand-teal flex items-center justify-center font-bold text-white text-sm shadow-sm">
              {getInitials(user.fullName)}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left pr-2">
              <span className="text-sm font-semibold text-brand-textDark leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-brand-textLight font-medium uppercase tracking-wider">{user.role.toLowerCase()}</span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close dropdown */}
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-2 z-20 w-48 bg-white border border-slate-100 rounded-lg shadow-lg py-1">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-bold text-brand-textDark truncate">{user.fullName}</p>
                  <p className="text-[10px] text-brand-textLight truncate">{user.email}</p>
                </div>
                
                {/* Profile menu links */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navigate to change password modal or page
                      // For simplicity we will handle it in a modal or profile subpages
                      window.location.href = user.role === 'ADMIN' ? '/admin/dashboard' : '/supervisor/dashboard';
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-xs text-brand-textMedium rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-brand-textLight" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-xs text-rose-600 font-medium rounded-md hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
