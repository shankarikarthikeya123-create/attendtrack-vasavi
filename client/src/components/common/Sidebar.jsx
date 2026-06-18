import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  CheckSquare,
  ClipboardList,
  BarChart3,
  LogOut,
  X
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Workers', path: '/admin/workers', icon: Users },
    { name: 'Construction Sites', path: '/admin/sites', icon: Building2 },
    { name: 'Supervisors', path: '/admin/supervisors', icon: UserCheck },
    { name: 'Mark Attendance', path: '/admin/mark-attendance', icon: CheckSquare },
    { name: 'Attendance Records', path: '/admin/attendance-records', icon: ClipboardList },
    { name: 'Monthly Reports', path: '/admin/reports', icon: BarChart3 }
  ];

  const supervisorLinks = [
    { name: 'Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/supervisor/mark-attendance', icon: CheckSquare },
    { name: 'Attendance History', path: '/supervisor/history', icon: ClipboardList },
    { name: 'Monthly Report', path: '/supervisor/report', icon: BarChart3 }
  ];

  const links = user.role === 'ADMIN' ? adminLinks : supervisorLinks;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-navyDark text-brand-sky border-l-4 border-brand-sky'
        : 'text-slate-300 hover:bg-brand-navyDark/50 hover:text-white'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-navy text-white shadow-xl">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-brand-navyDark">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-brand-sky">Attend</span>Track
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Vasavi Constructions
          </p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-slate-300 hover:text-white focus:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* User contextual card */}
      <div className="px-6 py-4 bg-brand-navyDark/30 border-b border-brand-navyDark">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-brand-teal flex items-center justify-center font-bold text-white shadow-sm">
            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-white">{user.fullName}</p>
            <p className="text-[10px] text-brand-sky font-semibold tracking-wider uppercase truncate">
              {user.role}
            </p>
            {user.role === 'SUPERVISOR' && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Site: {user.siteName || 'Not Assigned'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={index}
              to={link.path}
              className={linkClass}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-brand-navyDark">
        <button
          onClick={handleLogout}
          className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/20 hover:text-rose-200 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out bg-brand-navy ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
