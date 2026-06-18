import React from 'react';
import { HardHat } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const NotFoundPage = () => {
  const { user } = useAuth();

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
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-skyBg text-brand-navyDark mb-6">
          <HardHat className="h-10 w-10 text-brand-navy animate-bounce" />
        </div>
        <h1 className="text-4xl font-extrabold text-brand-navy mb-2">404</h1>
        <h2 className="text-lg font-bold text-brand-textMedium mb-3">Page Under Construction or Not Found</h2>
        <p className="text-brand-textLight text-sm mb-6">
          The link you followed may be broken or the page may have been removed. Let's get you back on track.
        </p>
        <button
          onClick={handleBack}
          className="w-full py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
        >
          Go Back to Safety
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
