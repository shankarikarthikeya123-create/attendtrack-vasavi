import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Users, 
  CheckSquare, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  HardHat
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/dashboard/supervisor');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load site dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { site, summary, lastSubmission, monthlySnapshot, recentDates } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-brand-navy">
            {getGreeting()}, {user?.fullName}!
          </h1>
          <p className="text-sm text-brand-textLight flex items-center gap-1">
            <MapPin className="h-4 w-4 text-brand-teal flex-shrink-0" />
            <span>Assigned site: <strong>{site.name} ({site.code})</strong> - {site.location}</span>
          </p>
        </div>
        <div className="text-xs font-semibold text-brand-textMedium bg-brand-skyBg px-3 py-1.5 rounded-lg border border-brand-sky/20">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Roster completion status alert (Warning/Success) */}
      {!summary.isCompleted ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start space-x-3.5">
          <AlertTriangle className="h-6 w-6 text-brand-accent flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800">Attendance Incomplete Today</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Only {summary.markedWorkers} of {summary.totalWorkers} workers have been marked for today. Please complete the logs before leaving the site.
            </p>
            <button
              onClick={() => navigate('/supervisor/mark-attendance')}
              className="mt-2 text-xs font-bold text-brand-navy hover:text-brand-navyDark flex items-center gap-1 cursor-pointer"
            >
              <span>Mark Today's Attendance</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start space-x-3.5">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-800">All Marks Submitted Successfully</h4>
            <p className="text-xs text-emerald-700">
              Attendance records for all {summary.totalWorkers} workers are completed and recorded.
            </p>
          </div>
        </div>
      )}

      {/* Main touch-friendly CTA (Supervisor Console Priority) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BIG CTA Button */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card flex flex-col justify-between md:col-span-2 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-navy">Daily Site Attendance</h3>
            <p className="text-sm text-brand-textLight leading-relaxed">
              Mark attendance for workers assigned to your site. You can also view recent marks and edit them.
            </p>
          </div>

          <button
            onClick={() => navigate('/supervisor/mark-attendance')}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-brand-navy hover:bg-brand-navyDark text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors w-full text-base min-h-[48px]"
          >
            <CheckSquare className="h-5 w-5" />
            <span>Mark Today's Attendance</span>
          </button>
        </div>

        {/* Attendance Completion Stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card flex flex-col justify-between space-y-4">
          <h3 className="text-base font-bold text-brand-navy">Roster Marks Progress</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-brand-textDark uppercase">
              <span>Marked Today</span>
              <span>{summary.markedWorkers} / {summary.totalWorkers}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-brand-teal h-3 rounded-full transition-all duration-300"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-brand-textLight">
            {lastSubmission ? (
              <span>Last marked submission: <strong>{new Date(lastSubmission.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            ) : (
              <span>No attendance submitted yet.</span>
            )}
          </div>
        </div>

      </div>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-card text-center">
          <span className="text-2xl font-extrabold text-brand-navy">{summary.totalWorkers}</span>
          <p className="text-[10px] text-brand-textLight uppercase font-bold tracking-wide mt-1">Assigned Workers</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
          <span className="text-2xl font-extrabold text-emerald-700">{summary.presentToday}</span>
          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wide mt-1">Present Today</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
          <span className="text-2xl font-extrabold text-rose-700">{summary.absentToday}</span>
          <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wide mt-1">Absent Today</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
          <span className="text-2xl font-extrabold text-amber-700">{summary.halfDayToday}</span>
          <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wide mt-1">Half-Day Today</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center col-span-2 md:col-span-1">
          <span className="text-2xl font-extrabold text-indigo-700">{summary.leaveToday}</span>
          <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wide mt-1">Leave Today</p>
        </div>
      </div>

      {/* Monthly snapshot and recent marks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Monthly Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
          <h3 className="text-base font-bold text-brand-navy flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-brand-teal" />
            <span>Monthly Site Snapshot (Current Month)</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-brand-textLight block font-semibold">Present Days</span>
              <strong className="text-lg font-bold text-emerald-700">{monthlySnapshot.present}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-brand-textLight block font-semibold">Absent Days</span>
              <strong className="text-lg font-bold text-rose-700">{monthlySnapshot.absent}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-brand-textLight block font-semibold">Half-Days marked</span>
              <strong className="text-lg font-bold text-amber-700">{monthlySnapshot.halfDay}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-brand-textLight block font-semibold">Leaves recorded</span>
              <strong className="text-lg font-bold text-indigo-700">{monthlySnapshot.leave}</strong>
            </div>
          </div>
        </div>

        {/* Recent Attendance Submissions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
          <h3 className="text-base font-bold text-brand-navy flex items-center gap-1.5">
            <Calendar className="h-5 w-5 text-brand-teal" />
            <span>Recent Attendance Dates</span>
          </h3>

          {recentDates.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No recent attendance marks recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDates.map((dateStr, idx) => (
                <div key={idx} className="flex justify-between items-center py-2.5">
                  <span className="text-sm font-semibold text-brand-navy">
                    {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => navigate('/supervisor/history')}
                    className="text-xs font-bold text-brand-teal hover:text-brand-tealLight cursor-pointer"
                  >
                    View Logs
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupervisorDashboard;
