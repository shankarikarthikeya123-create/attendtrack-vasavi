import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Users, Search, Plus, Edit, Power, User, Building2, Phone, Calendar, Briefcase, IndianRupee, MapPin } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const DESIGNATIONS = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Helper',
  'Site Labourer',
  'Welder',
  'Tile Worker',
  'Supervisor Assistant'
];

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter States
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // 'true', 'false', 'all'
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null); // null for create
  const [formData, setFormData] = useState({
    worker_code: '',
    full_name: '',
    phone: '',
    designation: '',
    site_id: '',
    daily_wage: '',
    joining_date: '',
    address: '',
    emergency_contact: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Status Toggle State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [workerToToggle, setWorkerToToggle] = useState(null);

  const fetchSites = async () => {
    try {
      const res = await axiosInstance.get('/sites?active=true');
      setSites(res.data);
    } catch (error) {
      console.error('Failed to load active sites:', error);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let url = `/workers?page=${page}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      if (selectedSite) url += `&siteId=${selectedSite}`;
      if (selectedDesignation) url += `&designation=${selectedDesignation}`;
      if (statusFilter !== 'all') url += `&active=${statusFilter}`;

      const res = await axiosInstance.get(url);
      setWorkers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load workers database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [page, search, selectedSite, selectedDesignation, statusFilter]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.worker_code.trim()) errors.worker_code = 'Worker code is required.';
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    if (!formData.designation) errors.designation = 'Please select a designation.';
    if (!formData.site_id) errors.site_id = 'Please assign a construction site.';
    if (!formData.daily_wage) {
      errors.daily_wage = 'Daily wage is required.';
    } else if (isNaN(formData.daily_wage) || parseFloat(formData.daily_wage) <= 0) {
      errors.daily_wage = 'Wage must be a positive number.';
    }
    if (!formData.joining_date) errors.joining_date = 'Joining date is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (worker = null) => {
    if (worker) {
      setCurrentWorker(worker);
      setFormData({
        worker_code: worker.workerCode,
        full_name: worker.fullName,
        phone: worker.phone,
        designation: worker.designation,
        site_id: worker.siteId,
        daily_wage: worker.dailyWage.toString(),
        joining_date: worker.joiningDate.substring(0, 10),
        address: worker.address || '',
        emergency_contact: worker.emergencyContact || '',
        notes: worker.notes || ''
      });
    } else {
      setCurrentWorker(null);
      setFormData({
        worker_code: '',
        full_name: '',
        phone: '',
        designation: DESIGNATIONS[0],
        site_id: sites.length > 0 ? sites[0].id : '',
        daily_wage: '',
        joining_date: new Date().toISOString().substring(0, 10),
        address: '',
        emergency_contact: '',
        notes: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentWorker(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (currentWorker) {
        await axiosInstance.put(`/workers/${currentWorker.id}`, formData);
        toast.success('Worker details updated successfully.');
      } else {
        await axiosInstance.post('/workers', formData);
        toast.success('Worker registered successfully.');
      }
      handleCloseModal();
      fetchWorkers();
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorsObj = {};
        error.response.data.errors.forEach(err => {
          errorsObj[err.field] = err.message;
        });
        setFormErrors(errorsObj);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save worker.');
      }
    }
  };

  // Toggle Status
  const handleOpenConfirm = (worker) => {
    setWorkerToToggle(worker);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setWorkerToToggle(null);
  };

  const handleToggleStatus = async () => {
    if (!workerToToggle) return;
    try {
      await axiosInstance.patch(`/workers/${workerToToggle.id}/status`, {
        is_active: !workerToToggle.isActive
      });
      toast.success(`Worker status updated successfully.`);
      handleCloseConfirm();
      fetchWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update worker status.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSite('');
    setSelectedDesignation('');
    setStatusFilter('true');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Worker Database</h1>
          <p className="text-sm text-brand-textLight">View active roster, designations, wage rates, and site assignments.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={sites.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-tealLight rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          <span>Register Worker</span>
        </button>
      </div>

      {sites.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <strong>Important Reminder:</strong> You must create at least one **active construction site** before you can register workers.
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            value={search}
            onChange={(val) => handleFilterChange(setSearch, val)}
            placeholder="Search name, code, phone..."
            onClear={() => handleFilterChange(setSearch, '')}
          />

          {/* Site Filter */}
          <select
            value={selectedSite}
            onChange={(e) => handleFilterChange(setSelectedSite, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.siteName}</option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => handleFilterChange(setSelectedDesignation, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
          >
            <option value="">All Designations</option>
            {DESIGNATIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
          >
            <option value="true">Active Workers</option>
            <option value="false">Inactive Workers</option>
            <option value="all">All Workers</option>
          </select>
        </div>

        {/* Clear filter indicator */}
        {(search || selectedSite || selectedDesignation || statusFilter !== 'true') && (
          <div className="flex justify-end pt-2">
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Workers Roster Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : workers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No workers found"
          description="We couldn't find any workers in this match. Try adjusting your search query or registering a new worker."
          actionText={!search && !selectedSite && !selectedDesignation ? "Register Worker" : undefined}
          onAction={!search && !selectedSite && !selectedDesignation ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-brand-navy uppercase tracking-wider">
                  <th className="px-6 py-4">Worker Code</th>
                  <th className="px-6 py-4">Worker Name</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Assigned Site</th>
                  <th className="px-6 py-4">Daily Wage</th>
                  <th className="px-6 py-4">Joining Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {workers.map(worker => (
                  <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-brand-teal">{worker.workerCode}</td>
                    <td className="px-6 py-4 font-semibold text-brand-textDark">{worker.fullName}</td>
                    <td className="px-6 py-4 text-brand-textMedium">{worker.designation}</td>
                    <td className="px-6 py-4 text-brand-textMedium truncate max-w-[150px]">{worker.siteName}</td>
                    <td className="px-6 py-4 font-bold text-brand-navy">₹{worker.dailyWage.toFixed(2)}</td>
                    <td className="px-6 py-4 text-brand-textLight text-xs">
                      {new Date(worker.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={worker.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex space-x-3">
                        <button
                          onClick={() => handleOpenConfirm(worker)}
                          className={`text-xs font-semibold ${
                            worker.isActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                          } cursor-pointer`}
                          title={worker.isActive ? 'Deactivate Worker' : 'Reactivate Worker'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(worker)}
                          className="text-xs font-semibold text-brand-navy hover:text-brand-navyDark cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit className="h-4 w-4 text-brand-textLight" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {workers.map(worker => (
              <div
                key={worker.id}
                className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest bg-brand-skyBg px-2 py-0.5 rounded-md">
                      {worker.workerCode}
                    </span>
                    <h3 className="text-base font-bold text-brand-navy mt-1.5">{worker.fullName}</h3>
                  </div>
                  <StatusBadge status={worker.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-brand-textMedium">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Briefcase className="h-3.5 w-3.5 text-brand-textLight flex-shrink-0" />
                    <span className="truncate">{worker.designation}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-brand-textLight flex-shrink-0" />
                    <span className="truncate">{worker.siteName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <IndianRupee className="h-3.5 w-3.5 text-brand-textLight flex-shrink-0" />
                    <span>₹{worker.dailyWage.toFixed(2)}/day</span>
                  </div>
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Phone className="h-3.5 w-3.5 text-brand-textLight flex-shrink-0" />
                    <span className="truncate">{worker.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-xs">
                  <button
                    onClick={() => handleOpenConfirm(worker)}
                    className={`flex items-center space-x-1 font-semibold ${
                      worker.isActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                    } cursor-pointer`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{worker.isActive ? 'Deactivate' : 'Reactivate'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(worker)}
                    className="flex items-center space-x-1 font-semibold text-brand-navy hover:text-brand-navyDark cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 text-brand-textLight" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentWorker ? 'Edit Worker Profile' : 'Register Worker'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="worker_code" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Worker Code *
              </label>
              <input
                id="worker_code"
                name="worker_code"
                type="text"
                value={formData.worker_code}
                onChange={handleInputChange}
                disabled={!!currentWorker} // Lock code on edit
                placeholder="e.g. W-1001"
                className={`w-full px-3 py-2 border rounded-xl text-sm ${
                  formErrors.worker_code ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                } ${currentWorker ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50'}`}
              />
              {formErrors.worker_code && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.worker_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="full_name" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Full Name *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="e.g. Kalyan Singh"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.full_name ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.full_name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.full_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 9000100001"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.phone ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="daily_wage" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Daily Wage Rate (₹) *
              </label>
              <input
                id="daily_wage"
                name="daily_wage"
                type="number"
                step="0.01"
                value={formData.daily_wage}
                onChange={handleInputChange}
                placeholder="e.g. 750"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.daily_wage ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.daily_wage && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.daily_wage}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="designation" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Designation *
              </label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white ${
                  formErrors.designation ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                {DESIGNATIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {formErrors.designation && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.designation}</p>
              )}
            </div>

            <div>
              <label htmlFor="site_id" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Assigned Site *
              </label>
              <select
                id="site_id"
                name="site_id"
                value={formData.site_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white ${
                  formErrors.site_id ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                <option value="" disabled>-- Select Site --</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.siteName}
                  </option>
                ))}
              </select>
              {formErrors.site_id && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.site_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="joining_date" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Joining Date *
              </label>
              <input
                id="joining_date"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.joining_date ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.joining_date && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.joining_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergency_contact" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Emergency Contact
              </label>
              <input
                id="emergency_contact"
                name="emergency_contact"
                type="text"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                placeholder="Name - Relationship - Phone"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              Residential Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Full address details..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              Special Notes / Health Conditions
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g. Certified height worker..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-brand-teal hover:bg-brand-tealLight rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              {currentWorker ? 'Save Changes' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate / Reactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleToggleStatus}
        title={workerToToggle?.isActive ? 'Deactivate Worker Profile?' : 'Reactivate Worker Profile?'}
        message={
          workerToToggle?.isActive
            ? `Are you sure you want to deactivate ${workerToToggle?.fullName}? They will immediately be removed from the supervisor's daily marking roster, but their historical attendance data will remain locked and preserved.`
            : `Are you sure you want to reactivate ${workerToToggle?.fullName}? They will immediately reappear on their assigned site's daily marking roster.`
        }
        confirmText={workerToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
        type={workerToToggle?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default WorkersPage;
