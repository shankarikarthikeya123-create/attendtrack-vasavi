import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  Search, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  User, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchInput from '../../components/common/SearchInput';

const STATUS_CONFIG = {
  PRESENT: { color: 'emerald', label: 'Present', icon: Check, btnBg: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600', inactiveBtn: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200 bg-white' },
  ABSENT: { color: 'rose', label: 'Absent', icon: X, btnBg: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600', inactiveBtn: 'text-rose-600 hover:bg-rose-50 border-rose-200 bg-white' },
  HALF_DAY: { color: 'amber', label: 'Half-Day', icon: Clock, btnBg: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600', inactiveBtn: 'text-amber-600 hover:bg-amber-50 border-amber-200 bg-white' },
  LEAVE: { color: 'indigo', label: 'Leave', icon: Calendar, btnBg: 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600', inactiveBtn: 'text-indigo-600 hover:bg-indigo-50 border-indigo-200 bg-white' }
};

const MarkAttendancePage = () => {
  const { user } = useAuth();
  
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // If Admin, load sites first
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchSites = async () => {
        try {
          const res = await axiosInstance.get('/sites?active=true');
          setSites(res.data);
          if (res.data.length > 0) {
            setSelectedSiteId(res.data[0].id.toString());
          }
        } catch (err) {
          toast.error('Failed to load active construction sites.');
        }
      };
      fetchSites();
    } else if (user?.role === 'SUPERVISOR') {
      setSelectedSiteId(user.siteId?.toString() || '');
    }
  }, [user]);

  // Load roster when site or date changes
  const fetchRoster = async () => {
    if (!selectedSiteId) return;
    setLoading(true);
    setNetworkError(false);
    try {
      const res = await axiosInstance.get(`/attendance/day?siteId=${selectedSiteId}&date=${date}`);
      setRoster(res.data.roster);
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      setNetworkError(true);
      toast.error('Failed to load daily roster. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedSiteId, date]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved attendance marks. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleStatusChange = (workerId, newStatus) => {
    setRoster(prev => 
      prev.map(item => 
        item.id === workerId ? { ...item, status: newStatus } : item
      )
    );
    setHasChanges(true);
  };

  const markAllPresent = () => {
    setRoster(prev => prev.map(item => ({ ...item, status: 'PRESENT' })));
    setHasChanges(true);
    toast.success('Marked all workers present locally.');
  };

  const clearAllMarks = () => {
    setRoster(prev => prev.map(item => ({ ...item, status: null })));
    setHasChanges(true);
    toast.success('Cleared all marks locally.');
  };

  const handleSave = async () => {
    const unmarkedCount = roster.filter(item => !item.status).length;
    if (unmarkedCount > 0) {
      if (!window.confirm(`There are ${unmarkedCount} unmarked workers. Unmarked workers will not be saved. Save anyway?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const recordsToSave = roster
        .filter(item => item.status)
        .map(item => ({
          worker_id: item.id,
          status: item.status
        }));

      await axiosInstance.post('/attendance/bulk', {
        site_id: parseInt(selectedSiteId),
        attendance_date: date,
        records: recordsToSave
      });

      toast.success('Daily attendance submitted successfully!');
      setHasChanges(false);
      fetchRoster(); // Reload roster to sync state
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance. Check connection.');
    } finally {
      setSaving(false);
    }
  };

  // Live calculation counts
  const totalWorkersCount = roster.length;
  const counts = roster.reduce(
    (acc, curr) => {
      if (curr.status === 'PRESENT') acc.present++;
      else if (curr.status === 'ABSENT') acc.absent++;
      else if (curr.status === 'HALF_DAY') acc.halfDay++;
      else if (curr.status === 'LEAVE') acc.leave++;
      else acc.unmarked++;
      return acc;
    },
    { present: 0, absent: 0, halfDay: 0, leave: 0, unmarked: 0 }
  );

  const markedWorkers = totalWorkersCount - counts.unmarked;
  const progressPercent = totalWorkersCount > 0 ? Math.round((markedWorkers / totalWorkersCount) * 100) : 0;

  // Filter roster by local search term
  const filteredRoster = roster.filter(item => 
    item.fullName.toLowerCase().includes(search.toLowerCase()) ||
    item.workerCode.toLowerCase().includes(search.toLowerCase()) ||
    item.designation.toLowerCase().includes(search.toLowerCase())
  );

  // Get date limits (no future dates)
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-24">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-brand-navy">Attendance Console</h1>
          <p className="text-sm text-brand-textLight">Record daily attendance. Green for present, Red for absent, Orange for half-day, Purple for leave.</p>
        </div>

        {/* Date and Site Selectors */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {user?.role === 'ADMIN' && (
            <div className="flex flex-col">
              <label htmlFor="admin_site_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
                Select Site
              </label>
              <select
                id="admin_site_select"
                value={selectedSiteId}
                onChange={(e) => {
                  if (hasChanges && !window.confirm('You have unsaved changes. Change site anyway?')) return;
                  setSelectedSiteId(e.target.value);
                }}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-w-[200px]"
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.siteName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col">
            <label htmlFor="attendance_date_picker" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Select Date
            </label>
            <input
              id="attendance_date_picker"
              type="date"
              value={date}
              max={maxDate}
              onChange={(e) => {
                if (hasChanges && !window.confirm('You have unsaved changes. Change date anyway?')) return;
                setDate(e.target.value);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-card text-center">
          <span className="text-2xl font-extrabold text-brand-navy">{totalWorkersCount}</span>
          <p className="text-[10px] text-brand-textLight uppercase font-bold tracking-wide mt-1">Total Workers</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
          <span className="text-2xl font-extrabold text-emerald-700">{counts.present}</span>
          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wide mt-1">Present</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
          <span className="text-2xl font-extrabold text-rose-700">{counts.absent}</span>
          <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wide mt-1">Absent</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
          <span className="text-2xl font-extrabold text-amber-700">{counts.halfDay}</span>
          <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wide mt-1">Half-Day</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center col-span-2 sm:col-span-1">
          <span className="text-2xl font-extrabold text-indigo-700">{counts.leave}</span>
          <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wide mt-1">Leave</p>
        </div>
      </div>

      {/* Actions and Local Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search worker name or code..."
          onClear={() => setSearch('')}
        />

        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={markAllPresent}
            disabled={totalWorkersCount === 0 || loading}
            className="flex-1 sm:flex-initial px-4 py-2 border border-emerald-200 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Mark All Present
          </button>
          <button
            onClick={clearAllMarks}
            disabled={totalWorkersCount === 0 || loading}
            className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Clear All Marks
          </button>
        </div>
      </div>

      {/* Roster Cards Deck / Desktop List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : networkError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-md mx-auto space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-800">Connection Failed</h3>
          <p className="text-xs text-rose-700">Unable to load worker roster from the server. Check your internet connection and retry.</p>
          <button
            onClick={fetchRoster}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredRoster.length === 0 ? (
        <EmptyState
          icon={User}
          title="No workers to mark"
          description={
            search 
              ? `No workers on the roster matched your search term "${search}".`
              : "There are no active workers registered for this construction site."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRoster.map((worker) => (
            <div
              key={worker.id}
              className={`bg-white rounded-2xl border ${
                worker.status ? 'border-slate-100 shadow-sm' : 'border-dashed border-slate-200 bg-slate-50/10'
              } p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
            >
              {/* Worker Profile Info */}
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-brand-skyBg text-brand-navy flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                  {worker.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-brand-textDark leading-tight flex items-center gap-1.5">
                    {worker.fullName}
                    <span className="text-[10px] text-brand-teal font-semibold">({worker.workerCode})</span>
                  </h4>
                  <p className="text-xs text-brand-textLight mt-0.5">{worker.designation}</p>
                </div>
              </div>

              {/* Status Click Targets (Touch targets min 44-48px) */}
              <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
                  const Icon = config.icon;
                  const isActive = worker.status === statusKey;
                  
                  return (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => handleStatusChange(worker.id, statusKey)}
                      className={`h-11 px-3 sm:px-4 border rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        isActive ? config.btnBg : config.inactiveBtn
                      }`}
                      title={`Mark ${config.label}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{config.label.split('-')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky Bottom Save Roster Panel */}
      {roster.length > 0 && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl px-6 py-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Live Progress Bar */}
            <div className="w-full sm:w-1/2 flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-brand-textDark uppercase mb-1">
                  <span>Progress Marked</span>
                  <span>{markedWorkers} / {totalWorkersCount} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-teal h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              {progressPercent === 100 && (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 hidden sm:block flex-shrink-0" />
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {hasChanges && (
                <span className="text-xs font-semibold text-brand-accent animate-pulse flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Unsaved Marks
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={saving || markedWorkers === 0}
                className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-brand-navy hover:bg-brand-navyDark rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendancePage;
