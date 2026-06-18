import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Users, 
  Building2, 
  UserCheck, 
  CheckSquare, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Calendar,
  AlertCircle,
  Plus,
  BarChart3
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/dashboard/admin');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  const summary = data.summary;

  // Pie chart data for today's attendance
  const pieData = [
    { name: 'Present', value: summary.presentToday, color: '#10B981' },
    { name: 'Absent', value: summary.absentToday, color: '#EF4444' },
    { name: 'Half-Day', value: summary.halfDayToday, color: '#F59E0B' },
    { name: 'Leave', value: summary.leaveToday, color: '#6366F1' }
  ].filter(item => item.value > 0); // Only display non-zero slices

  const totalTodayMarked = summary.presentToday + summary.absentToday + summary.halfDayToday + summary.leaveToday;

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">
            {getGreeting()}, {user?.fullName}!
          </h1>
          <p className="text-sm text-brand-textLight">Here is today's overview for Vasavi Constructions.</p>
        </div>
        <div className="text-sm font-semibold text-brand-textMedium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card hover:shadow-cardHover transition-all flex items-center space-x-4">
          <div className="p-3 bg-brand-skyBg text-brand-navy rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <span className="text-2xl font-extrabold text-brand-navy">{summary.totalWorkers}</span>
            <p className="text-xs text-brand-textLight font-semibold">Active Workers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card hover:shadow-cardHover transition-all flex items-center space-x-4">
          <div className="p-3 bg-brand-skyBg text-brand-navy rounded-xl"><Building2 className="h-6 w-6" /></div>
          <div>
            <span className="text-2xl font-extrabold text-brand-navy">{summary.totalSites}</span>
            <p className="text-xs text-brand-textLight font-semibold">Total Sites</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card hover:shadow-cardHover transition-all flex items-center space-x-4">
          <div className="p-3 bg-brand-skyBg text-brand-navy rounded-xl"><UserCheck className="h-6 w-6" /></div>
          <div>
            <span className="text-2xl font-extrabold text-brand-navy">{summary.totalSupervisors}</span>
            <p className="text-xs text-brand-textLight font-semibold">Supervisors</p>
          </div>
        </div>

        <div className="bg-brand-skyBg/35 p-5 rounded-2xl border border-brand-sky/20 shadow-card hover:shadow-cardHover transition-all flex items-center space-x-4">
          <div className="p-3 bg-brand-teal text-white rounded-xl"><IndianRupee className="h-6 w-6" /></div>
          <div>
            <span className="text-2xl font-extrabold text-brand-navy">₹{parseFloat(summary.estimatedPayroll).toLocaleString('en-IN')}</span>
            <p className="text-xs text-brand-textLight font-semibold">Month Payroll Est.</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Attendance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card lg:col-span-1">
          <h3 className="text-base font-bold text-brand-navy mb-4">Today's Presence</h3>
          <div className="h-64 relative flex flex-col justify-center items-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} workers`, 'Attendance']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-sm space-y-2 py-10">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <p>No attendance recorded today.</p>
              </div>
            )}
            {totalTodayMarked > 0 && (
              <div className="absolute top-[42%] flex flex-col items-center">
                <span className="text-2xl font-extrabold text-brand-navy">{totalTodayMarked}</span>
                <span className="text-[10px] uppercase font-bold text-brand-textLight">Marked</span>
              </div>
            )}
          </div>
        </div>

        {/* Site Progress Bars */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card lg:col-span-2">
          <h3 className="text-base font-bold text-brand-navy mb-4">Site Attendance Completion</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {data.siteProgress.map((site) => (
              <div key={site.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-brand-navy">{site.siteName}</span>
                    <span className="text-brand-textLight text-[10px] block">Supervisor: {site.supervisorName}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      site.isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {site.markedWorkers} / {site.totalWorkers} marked
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      site.isCompleted ? 'bg-emerald-500' : 'bg-brand-teal'
                    }`}
                    style={{ width: `${site.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Distribution & Payroll Estimates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workers Distribution per Site */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card lg:col-span-2">
          <h3 className="text-base font-bold text-brand-navy mb-4">Site Roster Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workerDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="siteName" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="workerCount" fill="#0F9D8A" radius={[4, 4, 0, 0]} barSize={35} name="Workers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Site Payroll Summaries list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card lg:col-span-1">
          <h3 className="text-base font-bold text-brand-navy mb-4">Est. Site Payroll (Month)</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {data.sitePayroll.map(payroll => (
              <div key={payroll.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-b-0">
                <div>
                  <h4 className="text-sm font-bold text-brand-navy">{payroll.siteName}</h4>
                  <span className="text-[10px] text-brand-textLight">{payroll.workerCount} workers</span>
                </div>
                <span className="text-sm font-extrabold text-brand-navy">
                  ₹{parseFloat(payroll.estimatedPayroll).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-brand-navy mb-4">Quick Actions Console</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/admin/workers')}
            className="flex flex-col items-center justify-center p-4 bg-slate-55 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center gap-2 cursor-pointer"
          >
            <Users className="h-5 w-5 text-brand-teal" />
            <span className="text-xs font-semibold text-brand-navy">Add Worker</span>
          </button>
          <button
            onClick={() => navigate('/admin/sites')}
            className="flex flex-col items-center justify-center p-4 bg-slate-55 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center gap-2 cursor-pointer"
          >
            <Building2 className="h-5 w-5 text-brand-navy" />
            <span className="text-xs font-semibold text-brand-navy">Add Site</span>
          </button>
          <button
            onClick={() => navigate('/admin/supervisors')}
            className="flex flex-col items-center justify-center p-4 bg-slate-55 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center gap-2 cursor-pointer"
          >
            <UserCheck className="h-5 w-5 text-brand-accent" />
            <span className="text-xs font-semibold text-brand-navy">Add Supervisor</span>
          </button>
          <button
            onClick={() => navigate('/admin/mark-attendance')}
            className="flex flex-col items-center justify-center p-4 bg-slate-55 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center gap-2 cursor-pointer"
          >
            <CheckSquare className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold text-brand-navy">Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex flex-col items-center justify-center p-4 bg-slate-55 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center gap-2 cursor-pointer col-span-2 sm:col-span-1"
          >
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <span className="text-xs font-semibold text-brand-navy">Monthly Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
