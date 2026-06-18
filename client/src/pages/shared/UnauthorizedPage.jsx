import React from 'react';
import { ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const UnauthorizedPage = () => {
  const { user, logout } = useAuth();

  const handleBack = () => {
    if (user) {
      window.location.href = user.role === 'ADMIN' ? '/admin/dashboard' : '/supervisor/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgMain px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-6">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Access Denied</h1>
        <p className="text-brand-textMedium text-sm mb-6">
          You do not have permission to access this page. This action has been logged and reported to the system administrator.
        </p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleBack}
            className="w-full py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={logout}
            className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Logout and Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
