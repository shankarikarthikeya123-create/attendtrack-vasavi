import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Building2, 
  Calculator, 
  Calendar, 
  IndianRupee 
} from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// SheetJS and jsPDF imports
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DESIGNATIONS = [
  'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 
  'Helper', 'Site Labourer', 'Welder', 'Tile Worker', 'Supervisor Assistant'
];

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, 
  { value: 3, label: 'March' }, { value: 4, label: 'April' }, 
  { value: 5, label: 'May' }, { value: 6, label: 'June' }, 
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, 
  { value: 9, label: 'September' }, { value: 10, label: 'October' }, 
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const YEARS = [2026, 2027, 2028];

const MonthlyReportsPage = ({ lockedSiteId }) => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'SUPERVISOR';
  const siteIdToUse = isSupervisor ? user?.siteId : lockedSiteId;

  const [reportData, setReportData] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month (1-indexed)
  const [year, setYear] = useState(new Date().getFullYear());
  const [siteId, setSiteId] = useState(siteIdToUse || '');
  const [search, setSearch] = useState('');
  const [designation, setDesignation] = useState('');

  const fetchSites = async () => {
    if (isSupervisor) return;
    try {
      const res = await axiosInstance.get('/sites?active=true');
      setSites(res.data);
      if (res.data.length > 0 && !siteId) {
        setSiteId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load active sites:', err);
    }
  };

  const fetchReport = async () => {
    const currentSiteId = isSupervisor ? user?.siteId : siteId;
    if (!currentSiteId) return;

    setLoading(true);
    try {
      let url = `/reports/monthly?month=${month}&year=${year}&siteId=${currentSiteId}`;
      if (search) url += `&search=${search}`;
      if (designation) url += `&designation=${designation}`;

      const res = await axiosInstance.get(url);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate monthly report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user]);

  useEffect(() => {
    fetchReport();
  }, [month, year, siteId, search, designation, user]);

  const handleFilterChange = (setter, value) => {
    setter(value);
  };

  // 1. Excel Export (using SheetJS)
  const exportToExcel = () => {
    if (!reportData || reportData.workers.length === 0) return;

    const formattedWorkers = reportData.workers.map(w => ({
      'Worker ID': w.workerCode,
      'Worker Name': w.fullName,
      'Designation': w.designation,
      'Daily Wage (INR)': w.dailyWage,
      'Present Days': w.attendance.present,
      'Absent Days': w.attendance.absent,
      'Half-Days': w.attendance.halfDay,
      'Leaves': w.attendance.leave,
      'Payable Days': w.payableDays,
      'Gross Salary (INR)': w.grossSalary
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedWorkers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    // Add totals row manually
    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ['Total Workers', reportData.summary.totalWorkers, '', '', 'Present Sum', reportData.summary.presentCount, 'Absent Sum', reportData.summary.absentCount, 'Payable Days Sum', reportData.summary.payableDays],
      ['Estimated Payroll (INR)', reportData.summary.estimatedPayroll]
    ], { origin: -1 });

    // Save File
    const siteNameSlug = reportData.siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `attendtrack_report_${siteNameSlug}_m${month}_y${year}.xlsx`);
    toast.success('Excel spreadsheet exported successfully!');
  };

  // 2. PDF Export (using jsPDF & jsPDF-AutoTable)
  const exportToPDF = () => {
    if (!reportData || reportData.workers.length === 0) return;

    const doc = new jsPDF();
    const formattedMonth = MONTHS.find(m => m.value === month)?.label;

    // Header Content
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(23, 59, 87); // Brand Navy
    doc.text('VASAVI CONSTRUCTIONS', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Text Light
    doc.text('AttendTrack - Worker Attendance & Salary Management System', 14, 25);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 28, 196, 28);

    // Metadata Details
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // Text Dark
    doc.text(`Construction Site: ${reportData.siteName}`, 14, 35);
    doc.text(`Reporting Period: ${formattedMonth} ${year}`, 14, 40);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 45);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, 31, 76, 17, 2, 2, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ESTIMATED PAYROLL SUMMARY', 123, 36);
    doc.setFontSize(14);
    doc.setTextColor(15, 93, 138); // Brand Teal
    doc.text(`INR ${parseFloat(reportData.summary.estimatedPayroll).toLocaleString('en-IN')}`, 123, 44);

    // Workers Table Columns
    const columns = [
      { header: 'ID', dataKey: 'code' },
      { header: 'Worker Name', dataKey: 'name' },
      { header: 'Designation', dataKey: 'designation' },
      { header: 'Wage', dataKey: 'wage' },
      { header: 'P', dataKey: 'present' },
      { header: 'A', dataKey: 'absent' },
      { header: 'H', dataKey: 'half' },
      { header: 'L', dataKey: 'leave' },
      { header: 'Payable', dataKey: 'payable' },
      { header: 'Gross Salary', dataKey: 'gross' }
    ];

    const rows = reportData.workers.map(w => ({
      code: w.workerCode,
      name: w.fullName,
      designation: w.designation,
      wage: `Rs.${w.dailyWage.toFixed(0)}`,
      present: w.attendance.present,
      absent: w.attendance.absent,
      half: w.attendance.halfDay,
      leave: w.attendance.leave,
      payable: w.payableDays.toFixed(1),
      gross: `Rs.${w.grossSalary.toFixed(2)}`
    }));

    doc.autoTable({
      columns,
      body: rows,
      startY: 52,
      theme: 'striped',
      headStyles: { fillColor: [23, 59, 87], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      columnStyles: {
        name: { cellWidth: 35 },
        gross: { fontStyle: 'bold', halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // Salary Formula details at bottom
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('* Salary Formula: payableDays = presentDays + (halfDays * 0.5); grossSalary = payableDays * dailyWageRate.', 14, finalY);
    doc.text('This is an attendance-based salary estimation for internal bookkeeping only.', 14, finalY + 4);

    // Save PDF
    const siteNameSlug = reportData.siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`attendtrack_report_${siteNameSlug}_m${month}_y${year}.pdf`);
    toast.success('PDF report exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0 print:bg-white">
      {/* Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Monthly Reports</h1>
          <p className="text-sm text-brand-textLight">View payable days counts, wages breakdown, and download summaries.</p>
        </div>

        {reportData && reportData.workers.length > 0 && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 border border-emerald-200 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="Print Page"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Selection Panel (Hidden on print) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Month */}
          <div className="flex flex-col">
            <label htmlFor="month_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Select Month
            </label>
            <select
              id="month_select"
              value={month}
              onChange={(e) => handleFilterChange(setMonth, parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col">
            <label htmlFor="year_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Select Year
            </label>
            <select
              id="year_select"
              value={year}
              onChange={(e) => handleFilterChange(setYear, parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Site (Admin only) */}
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
                <option value="" disabled>-- Select Site --</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.siteName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Worker */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Worker Query
            </label>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Name or worker ID..."
              onClear={() => setSearch('')}
            />
          </div>

          {/* Designation */}
          <div className="flex flex-col">
            <label htmlFor="designation_select" className="text-[10px] font-bold text-brand-textLight uppercase tracking-wider mb-1">
              Designation
            </label>
            <select
              id="designation_select"
              value={designation}
              onChange={(e) => handleFilterChange(setDesignation, e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white min-h-[38px]"
            >
              <option value="">All Designations</option>
              {DESIGNATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Report Summary Card Block */}
      {reportData && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="p-3 bg-brand-skyBg text-brand-navy rounded-xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-brand-textLight uppercase tracking-wider font-bold">Construction Site</p>
              <h4 className="text-base font-bold text-brand-navy">{reportData.siteName}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="p-3 bg-brand-skyBg text-brand-navy rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-brand-textLight uppercase tracking-wider font-bold">Reporting Month</p>
              <h4 className="text-base font-bold text-brand-navy">
                {MONTHS.find(m => m.value === reportData.month)?.label} {reportData.year}
              </h4>
            </div>
          </div>

          <div className="bg-brand-skyBg/30 p-5 rounded-2xl border border-brand-sky/20 shadow-card flex items-center space-x-4">
            <div className="p-3 bg-brand-teal text-white rounded-xl">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-brand-textLight uppercase tracking-wider font-bold">Estimated Payroll</p>
              <h4 className="text-lg font-extrabold text-brand-navy">
                ₹{parseFloat(reportData.summary.estimatedPayroll).toLocaleString('en-IN')}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      ) : !reportData || reportData.workers.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports generated"
          description="Select a construction site and month to display attendance calculations."
        />
      ) : (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-card print:border-none print:shadow-none print:p-0">
          
          {/* Printable Header Info */}
          <div className="hidden print:block space-y-4 mb-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800">VASAVI CONSTRUCTIONS</h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">AttendTrack Attendance & Salary Summary</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{reportData.siteName}</p>
                <p className="text-xs text-slate-500">
                  Period: {MONTHS.find(m => m.value === reportData.month)?.label} {reportData.year}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Workers</p>
                <p className="text-sm font-bold text-slate-800">{reportData.summary.totalWorkers}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Payable Days</p>
                <p className="text-sm font-bold text-slate-800">{reportData.summary.payableDays} days</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Estimated Payroll</p>
                <p className="text-sm font-bold text-emerald-700">₹{parseFloat(reportData.summary.estimatedPayroll).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-brand-navy uppercase tracking-wider print:bg-slate-100">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Worker Name</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3 text-right">Daily Wage</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">A</th>
                  <th className="px-4 py-3 text-center">H</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">Payable Days</th>
                  <th className="px-4 py-3 text-right">Gross Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reportData.workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                    <td className="px-4 py-3 font-bold text-brand-teal print:text-slate-800">{w.workerCode}</td>
                    <td className="px-4 py-3 font-semibold text-brand-textDark">{w.fullName}</td>
                    <td className="px-4 py-3 text-brand-textLight text-xs">{w.designation}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{w.dailyWage.toFixed(0)}</td>
                    <td className="px-4 py-3 text-center text-emerald-700 font-semibold">{w.attendance.present}</td>
                    <td className="px-4 py-3 text-center text-rose-700 font-semibold">{w.attendance.absent}</td>
                    <td className="px-4 py-3 text-center text-amber-700 font-semibold">{w.attendance.halfDay}</td>
                    <td className="px-4 py-3 text-center text-indigo-700 font-semibold">{w.attendance.leave}</td>
                    <td className="px-4 py-3 text-center font-bold text-brand-navy">{w.payableDays.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-brand-navy">₹{w.grossSalary.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Summary Row */}
                <tr className="bg-slate-50/50 font-bold border-t-2 border-slate-100 print:bg-slate-100">
                  <td className="px-4 py-4" colSpan={3}>Totals</td>
                  <td className="px-4 py-4 text-right">-</td>
                  <td className="px-4 py-4 text-center text-emerald-700">{reportData.summary.presentCount}</td>
                  <td className="px-4 py-4 text-center text-rose-700">{reportData.summary.absentCount}</td>
                  <td className="px-4 py-4 text-center text-amber-700">{reportData.summary.halfDayCount}</td>
                  <td className="px-4 py-4 text-center text-indigo-700">{reportData.summary.leaveCount}</td>
                  <td className="px-4 py-4 text-center text-brand-navy">{reportData.summary.payableDays}</td>
                  <td className="px-4 py-4 text-right text-brand-navy text-base">
                    ₹{parseFloat(reportData.summary.estimatedPayroll).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formula disclosure footer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-brand-textLight space-y-1 print:border-none print:bg-transparent print:p-0">
            <p className="font-semibold text-brand-textMedium">Formula Explanations:</p>
            <p>1. Payable Days = Days Present + (Half-Days × 0.5)</p>
            <p>2. Gross Salary = Payable Days × Daily Wage Rate</p>
            <p className="text-[10px] text-slate-400 italic mt-1">This report is an attendance-based payroll estimation, not a bank transfer receipt.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportsPage;
