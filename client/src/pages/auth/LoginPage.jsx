import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff, Lock, User, HardHat, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'Username or email is required.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = await login(username, password);
      if (userData.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/supervisor/dashboard', { replace: true });
      }
    } catch (err) {
      // Error is already toasted inside login context, just handle loading state here
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bgMain">
      {/* Split-screen layout: Left visual sidebar (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-navy relative items-center justify-center overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-96 h-96 bg-brand-teal rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-brand-sky rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-0.5 h-64 bg-white transform rotate-45" />
          <div className="absolute top-1/4 left-1/3 w-0.5 h-48 bg-white transform rotate-45" />
        </div>

        {/* Brand visual showcase */}
        <div className="relative z-10 max-w-lg px-8 text-center text-white">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-brand-navyDark border border-brand-sky/20 rounded-2xl shadow-lg mb-6">
            <HardHat className="h-9 w-9 text-brand-sky" />
          </div>
          
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Attend<span className="text-brand-sky">Track</span>
          </h2>
          <p className="text-sm font-semibold tracking-widest text-slate-300 uppercase mb-6">
            Vasavi Constructions, Hyderabad
          </p>
          
          <p className="text-slate-300 text-base leading-relaxed mb-8">
            A secure, role-based worker attendance and wage estimation system designed to bring transparency, accuracy, and efficiency to our construction sites.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-brand-navyDark/35 border border-brand-navyDark rounded-xl">
              <ShieldCheck className="h-5 w-5 text-brand-teal mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Site Lockout</h4>
              <p className="text-xs text-slate-400">Supervisors access only their assigned construction site data.</p>
            </div>
            <div className="p-4 bg-brand-navyDark/35 border border-brand-navyDark rounded-xl">
              <HardHat className="h-5 w-5 text-brand-accent mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Instant Reports</h4>
              <p className="text-xs text-slate-400">Export audited monthly attendance and payroll estimates to Excel & PDF.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Split-screen layout: Right login card (full-width on mobile) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24 bg-brand-bgMain">
        <div className="mx-auto w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
          {/* Logo & Mobile Brand */}
          <div className="text-center lg:text-left mb-8">
            <div className="lg:hidden inline-flex items-center justify-center h-12 w-12 bg-brand-navy rounded-xl shadow-md mb-3">
              <HardHat className="h-6 w-6 text-brand-sky" />
            </div>
            <h1 className="text-2xl font-bold text-brand-navy">
              Sign In
            </h1>
            <p className="text-sm font-medium text-brand-textLight mt-1">
              AttendTrack Worker Attendance System
            </p>
            <p className="text-xs font-bold text-brand-teal uppercase tracking-wider mt-0.5">
              Vasavi Constructions
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-brand-textMedium uppercase tracking-wide mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.username ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  } rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-colors focus:bg-white`}
                  placeholder="Enter email or username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-brand-textMedium uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  } rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-colors focus:bg-white`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-navy focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-navy hover:bg-brand-navyDark shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In to Console'
              )}
            </button>
          </form>

          {/* Secure notification disclaimer */}
          <div className="mt-6 text-center text-slate-400 text-[10px]">
            <p>© 2026 Vasavi Constructions. All rights reserved.</p>
            <p className="mt-1">This console is monitored. Unauthorized access attempts are logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
