import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  Building2, 
  User, 
  Filter, 
  RefreshCw,
  Power
} from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const AttendanceRecordsPage = ({ lockedSiteId }) => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'SUPERVISOR';
  const siteIdToUse = isSupervisor ? user?.siteId : lockedSiteId;

  const [logs, setLogs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [siteId, setSiteId] = useState(siteIdToUse || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const fetchSites = async () => {
    if (isSupervisor) return;
    try {
      const res = await axiosInstance.get('/sites?active=true');
      setSites(res.data);
    } catch (err) {
      console.error('Failed to load active sites:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/attendance?page=${page}&limit=${limit}`;
      
      const currentSiteId = isSupervisor ? user?.siteId : siteId;
      if (currentSiteId) url += `&siteId=${currentSiteId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${search}`;

      const res = await axiosInstance.get(url);
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [page, siteId, startDate, endDate, status, search, user]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    if (!isSupervisor) setSiteId('');
    setStartDate('');
    setEndDate('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          {isSupervisor ? 'Site Attendance History' : 'Attendance Logs'}
        </h1>
        <p className="text-sm text-brand-textLight">
          {isSupervisor 
            ? `Historical attendance records for ${user?.siteName || 'your assigned site'}.`
            : 'Audit history and list of marked worker attendance across all construction sites.'
          }
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Search worker */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Search Worker
            </label>
            <SearchInput
              value={search}
              onChange={(val) => handleFilterChange(setSearch, val)}
              placeholder="Name or worker code..."
              onClear={() => handleFilterChange(setSearch, '')}
            />
          </div>

          {/* Site Selector (Only visible for Admins) */}
          {!isSupervisor && (
            <div className="flex flex-col">
              <label htmlFor="site_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
                Construction Site
              </label>
              <select
                id="site_select"
                value={siteId}
                onChange={(e) => handleFilterChange(setSiteId, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.siteName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Selector */}
          <div className="flex flex-col">
            <label htmlFor="status_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              id="status_select"
              value={status}
              onChange={(e) => handleFilterChange(setStatus, e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half-Day</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label htmlFor="start_date_filter" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              id="start_date_filter"
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label htmlFor="end_date_filter" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              id="end_date_filter"
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            />
          </div>

        </div>

        {/* Clear filters trigger */}
        {(search || siteId || startDate || endDate || status) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear Search Filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No records found"
          description="We couldn't find any attendance logs matching the selected filters."
        />
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-brand-navy uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Worker Code</th>
                  <th className="px-6 py-4">Worker Name</th>
                  <th className="px-6 py-4">Designation</th>
                  {!isSupervisor && <th className="px-6 py-4">Site</th>}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Marked By</th>
                  <th className="px-6 py-4 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-brand-navy">
                      {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-teal">{log.workerCode}</td>
                    <td className="px-6 py-4 font-semibold text-brand-textDark">{log.workerName}</td>
                    <td className="px-6 py-4 text-brand-textLight text-xs">{log.designation}</td>
                    {!isSupervisor && (
                      <td className="px-6 py-4 text-brand-textMedium truncate max-w-[150px]">
                        {log.siteName}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {log.markedBy}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-[11px]">
                      {new Date(log.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="text-sm font-bold text-brand-navy mt-1 leading-tight">
                      {log.workerName} <span className="text-[10px] text-brand-teal">({log.workerCode})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">{log.designation}</p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>

                <div className="pt-2 border-t border-slate-50 text-[10px] text-brand-textLight flex justify-between">
                  <span>Marked by: <strong>{log.markedBy}</strong></span>
                  {!isSupervisor && <span>Site: <strong>{log.siteName}</strong></span>}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-card">
              <span className="text-xs font-semibold text-brand-textLight uppercase">
                Page {page} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AttendanceRecordsPage;
