import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Building2, MapPin, User, Users, Calendar, Plus, Search, Edit, Power } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const SitesPage = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null); // null for create, object for edit
  const [formData, setFormData] = useState({
    site_code: '',
    site_name: '',
    location: '',
    description: '',
    start_date: '',
    expected_completion_date: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Confirm State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [siteToToggle, setSiteToToggle] = useState(null);

  const fetchSites = async () => {
    setLoading(true);
    try {
      let url = '/sites';
      if (filterActive !== 'all') {
        url += `?active=${filterActive === 'active'}`;
      }
      const res = await axiosInstance.get(url);
      setSites(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load construction sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [filterActive]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.site_code.trim()) errors.site_code = 'Site code is required.';
    if (!formData.site_name.trim()) errors.site_name = 'Site name is required.';
    if (!formData.location.trim()) errors.location = 'Location is required.';
    if (!formData.start_date) errors.start_date = 'Start date is required.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (site = null) => {
    if (site) {
      setCurrentSite(site);
      setFormData({
        site_code: site.siteCode,
        site_name: site.siteName,
        location: site.location,
        description: site.description || '',
        start_date: site.startDate.substring(0, 10),
        expected_completion_date: site.expectedCompletionDate ? site.expectedCompletionDate.substring(0, 10) : ''
      });
    } else {
      setCurrentSite(null);
      setFormData({
        site_code: '',
        site_name: '',
        location: '',
        description: '',
        start_date: new Date().toISOString().substring(0, 10),
        expected_completion_date: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSite(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (currentSite) {
        // Edit site
        await axiosInstance.put(`/sites/${currentSite.id}`, formData);
        toast.success('Construction site updated successfully.');
      } else {
        // Create site
        await axiosInstance.post('/sites', formData);
        toast.success('Construction site registered successfully.');
      }
      handleCloseModal();
      fetchSites();
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorsObj = {};
        error.response.data.errors.forEach(err => {
          errorsObj[err.field] = err.message;
        });
        setFormErrors(errorsObj);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save construction site.');
      }
    }
  };

  const handleOpenConfirm = (site) => {
    setSiteToToggle(site);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setSiteToToggle(null);
  };

  const handleToggleStatus = async () => {
    if (!siteToToggle) return;
    try {
      await axiosInstance.patch(`/sites/${siteToToggle.id}/status`, {
        is_active: !siteToToggle.isActive
      });
      toast.success(`Site status updated successfully.`);
      handleCloseConfirm();
      fetchSites();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update site status.');
    }
  };

  // Filtered sites list based on search term
  const filteredSites = sites.filter(site => 
    site.siteName.toLowerCase().includes(search.toLowerCase()) ||
    site.siteCode.toLowerCase().includes(search.toLowerCase()) ||
    site.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Construction Sites</h1>
          <p className="text-sm text-brand-textLight">Manage and assign supervisors to active Vasavi construction sites.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-tealLight rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Site</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sites, codes, locations..."
          onClear={() => setSearch('')}
        />
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-brand-textMedium uppercase">Status:</label>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {['all', 'active', 'inactive'].map((option) => (
              <button
                key={option}
                onClick={() => setFilterActive(option)}
                className={`px-3 py-1 text-xs font-semibold rounded-md uppercase tracking-wider transition-colors cursor-pointer ${
                  filterActive === option
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-brand-textLight hover:text-brand-textMedium'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : filteredSites.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No sites found"
          description={
            search 
              ? `No construction sites matched your search term "${search}".`
              : "No construction sites registered in the database."
          }
          actionText={!search ? "Add New Site" : undefined}
          onAction={!search ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className={`bg-white rounded-2xl border ${
                site.isActive ? 'border-slate-100' : 'border-rose-100 bg-rose-50/5'
              } p-6 shadow-card hover:shadow-cardHover transition-all duration-200 flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Site Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest bg-brand-skyBg px-2 py-0.5 rounded-md">
                      {site.siteCode}
                    </span>
                    <h3 className="text-lg font-bold text-brand-navy mt-1.5 line-clamp-1">{site.siteName}</h3>
                  </div>
                  <StatusBadge status={site.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                <p className="text-sm text-brand-textLight line-clamp-2 min-h-[40px]">
                  {site.description || 'No description provided.'}
                </p>

                {/* Info List */}
                <div className="space-y-2 pt-2 text-xs text-brand-textMedium">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span>Supervisor: <strong className="text-brand-navy">{site.supervisor?.name || 'Unassigned'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span>Workers: <strong className="text-brand-navy">{site.workerCount} active</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-brand-textLight flex-shrink-0" />
                    <span>Started: {new Date(site.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center justify-between border-t border-slate-50 mt-6 pt-4">
                <button
                  onClick={() => handleOpenConfirm(site)}
                  className={`flex items-center space-x-1 text-xs font-semibold ${
                    site.isActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                  } transition-colors cursor-pointer`}
                >
                  <Power className="h-4 w-4" />
                  <span>{site.isActive ? 'Deactivate' : 'Reactivate'}</span>
                </button>

                <button
                  onClick={() => handleOpenModal(site)}
                  className="flex items-center space-x-1 text-xs font-semibold text-brand-navy hover:text-brand-navyDark transition-colors cursor-pointer"
                >
                  <Edit className="h-4 w-4 text-brand-textLight" />
                  <span>Edit Site</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentSite ? 'Edit Construction Site' : 'Add Construction Site'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="site_code" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Site Code *
              </label>
              <input
                id="site_code"
                name="site_code"
                type="text"
                value={formData.site_code}
                onChange={handleInputChange}
                disabled={!!currentSite} // Lock code on edit
                placeholder="e.g. VS-HYD-001"
                className={`w-full px-3 py-2 border rounded-xl text-sm ${
                  formErrors.site_code ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                } ${currentSite ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50'}`}
              />
              {formErrors.site_code && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.site_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="site_name" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Site Name *
              </label>
              <input
                id="site_name"
                name="site_name"
                type="text"
                value={formData.site_name}
                onChange={handleInputChange}
                placeholder="e.g. Vasavi Prime Heights"
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.site_name ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.site_name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.site_name}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              Location *
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g. Gachibowli, Hyderabad"
              className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                formErrors.location ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {formErrors.location && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of project scope..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Start Date *
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 ${
                  formErrors.start_date ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {formErrors.start_date && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.start_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="expected_completion_date" className="block text-xs font-bold text-brand-textMedium uppercase mb-1">
                Expected Completion
              </label>
              <input
                id="expected_completion_date"
                name="expected_completion_date"
                type="date"
                value={formData.expected_completion_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>
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
              {currentSite ? 'Save Changes' : 'Create Site'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate / Reactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleToggleStatus}
        title={siteToToggle?.isActive ? 'Deactivate Site?' : 'Reactivate Site?'}
        message={
          siteToToggle?.isActive
            ? `Are you sure you want to deactivate ${siteToToggle?.siteName}? Newly hired workers will not be assignable to this site, and attendance records will be locked.`
            : `Are you sure you want to reactivate ${siteToToggle?.siteName}? Supervisors will immediately be able to record attendance.`
        }
        confirmText={siteToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
        type={siteToToggle?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default SitesPage;
