import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { UserCheck, Mail, Phone, Building2, Plus, Search, Edit, Power, Key } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const SupervisorsPage = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [activeSites, setActiveSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Account Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupervisor, setCurrentSupervisor] = useState(null); // null for create
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    site_id: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Reset Password Modal State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Status Toggle State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supervisorToToggle, setSupervisorToToggle] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [supervisorsRes, sitesRes] = await Promise.all([
        axiosInstance.get('/supervisors'),
        axiosInstance.get('/sites?active=true')
      ]);
      setSupervisors(supervisorsRes.data);
      setActiveSites(sitesRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load supervisor and site lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Supervisor name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Must be a valid email.';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required.';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    
    if (!currentSupervisor && !formData.password) {
      errors.password = 'Password is required.';
    } else if (!currentSupervisor && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.site_id) errors.site_id = 'Please assign a construction site.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (sup = null) => {
    if (sup) {
      setCurrentSupervisor(sup);
      setFormData({
        full_name: sup.fullName,
        email: sup.email,
        username: sup.username,
        phone: sup.phone,
        password: '', // Password is not editable in edit modal
        site_id: sup.siteId || ''
      });
    } else {
      setCurrentSupervisor(null);
      setFormData({
        full_name: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        site_id: activeSites.length > 0 ? activeSites[0].id : ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSupervisor(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (currentSupervisor) {
        // Update supervisor
        await axiosInstance.put(`/supervisors/${currentSupervisor.id}`, {
          full_name: formData.full_name,
          email: formData.email,
          username: formData.username,
          phone: formData.phone,
          site_id: formData.site_id
        });
        toast.success('Supervisor details updated successfully.');
      } else {
        // Create supervisor
        await axiosInstance.post('/supervisors', formData);
        toast.success('Supervisor account created successfully.');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorsObj = {};
        error.response.data.errors.forEach(err => {
          errorsObj[err.field] = err.message;
        });
        setFormErrors(errorsObj);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save supervisor.');
      }
    }
  };

  // Status Toggles
  const handleOpenConfirm = (sup) => {
    setSupervisorToToggle(sup);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setSupervisorToToggle(null);
  };

  const handleToggleStatus = async () => {
    if (!supervisorToToggle) return;
    try {
      await axiosInstance.patch(`/supervisors/${supervisorToToggle.id}/status`, {
        is_active: !supervisorToToggle.isActive
      });
      toast.success(`Supervisor status updated successfully.`);
      handleCloseConfirm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update supervisor status.');
    }
  };

  // Reset Password
  const handleOpenReset = (id) => {
    setResetId(id);
    setNewPassword('');
    setResetError('');
    setIsResetOpen(true);
  };

  const handleCloseReset = () => {
    setIsResetOpen(false);
    setResetId(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setResetError('Password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    try {
      await axiosInstance.patch(`/supervisors/${resetId}/reset-password`, {
        password: newPassword
      });
      toast.success('Supervisor password has been reset.');
      handleCloseReset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Filter supervisor list based on search term
  const filteredSupervisors = supervisors.filter(sup => 
    sup.fullName.toLowerCase().includes(search.toLowerCase()) ||
    sup.email.toLowerCase().includes(search.toLowerCase()) ||
    sup.username.toLowerCase().includes(search.toLowerCase()) ||
    sup.phone.includes(search) ||
    sup.siteName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Site Supervisors</h1>
          <p className="text-sm text-brand-textLight">Manage supervisor login accounts and assign them to specific sites.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={activeSites.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-tealLight rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supervisor</span>
        </button>
      </div>

      {activeSites.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <strong>Important Reminder:</strong> You must create at least one **active construction site** before you can register site supervisor accounts.
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-card flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, site..."
          onClear={() => setSearch('')}
        />
      </div>

      {/* Supervisors Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No supervisors found"
          description={
            search 
              ? `No supervisors matched your search term "${search}".`
              : "No supervisor accounts registered in the system."
          }
          actionText={!search && activeSites.length > 0 ? "Add Supervisor" : undefined}
          onAction={!search && activeSites.length > 0 ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupervisors.map((sup) => (
            <div
              key={sup.id}
              className={`bg-white rounded-2xl border ${
                sup.isActive ? 'border-slate-100' : 'border-rose-100 bg-rose-50/5'
              } p-6 shadow-card hover:shadow-cardHover transition-all duration-200 flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-brand-skyBg text-brand-navy flex items-center justify-center font-bold text-sm">
                      {sup.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-brand-navy leading-tight">{sup.fullName}</h3>
                      <span className="text-[10px] text-brand-textLight">@{sup.username}</span>
                    </div>
                  </div>
                  <StatusBadge status={sup.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                {/* Details */}
                <div className="space-y-2 pt-2 text-xs text-brand-textMedium">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span>Assigned Site: <strong className="text-brand-navy">{sup.siteName}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center justify-between border-t border-slate-50 mt-6 pt-4">
                <button
                  onClick={() => handleOpenConfirm(sup)}
                  className={`flex items-center space-x-1 text-xs font-semibold ${
                    sup.isActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                  } transition-colors cursor-pointer`}
                >
                  <Power className="h-4 w-4" />
                  <span>{sup.isActive ? 'Deactivate' : 'Reactivate'}</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleOpenReset(sup.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-brand-accent hover:text-brand-accentLight transition-colors cursor-pointer"
                    title="Reset Password"
                  >
                    <Key className="h-4 w-4" />
                    <span>Reset PW</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(sup)}
                    className="flex items-center space-x-1 text-xs font-semibold text-brand-navy hover:text-brand-navyDark transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4 text-brand-textLight" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentSupervisor ? 'Edit Supervisor Account' : 'Register Site Supervisor'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g. Ramesh Kumar"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.full_name ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.full_name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Contact Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 9848012345"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.phone ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="supervisor@vasavi.com"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.email ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="e.g. ramesh.site1"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.username ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.username && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.username}</p>
              )}
            </div>
          </div>

          {!currentSupervisor && (
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Default Password *
              </label>
              <input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password (min 6 characters)"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.password ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.password && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.password}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="site_id" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              Assign Construction Site *
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
              {activeSites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.siteName} ({site.siteCode})
                </option>
              ))}
            </select>
            {formErrors.site_id && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.site_id}</p>
            )}
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
              {currentSupervisor ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetOpen} onClose={handleCloseReset} title="Reset Supervisor Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="reset_password" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              New Password *
            </label>
            <input
              id="reset_password"
              type="text"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (resetError) setResetError('');
              }}
              placeholder="Enter new password (min 6 characters)"
              className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                resetError ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {resetError && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{resetError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={handleCloseReset}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-brand-accent hover:bg-brand-accentLight rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Reset Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Reactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleToggleStatus}
        title={supervisorToToggle?.isActive ? 'Deactivate Supervisor Account?' : 'Reactivate Supervisor Account?'}
        message={
          supervisorToToggle?.isActive
            ? `Are you sure you want to deactivate ${supervisorToToggle?.fullName}? This supervisor will be logged out and immediately barred from logging back in.`
            : `Are you sure you want to reactivate ${supervisorToToggle?.fullName}? They will be able to log in and mark attendance for their site.`
        }
        confirmText={supervisorToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
        type={supervisorToToggle?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default SupervisorsPage;
