import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = status.toUpperCase();

  const config = {
    // Attendance statuses
    PRESENT: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      label: 'Present'
    },
    ABSENT: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      label: 'Absent'
    },
    HALF_DAY: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      label: 'Half-Day'
    },
    LEAVE: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      label: 'Leave'
    },
    // Account / entity statuses
    ACTIVE: {
      bg: 'bg-teal-50 border-brand-teal/20 text-brand-teal',
      label: 'Active'
    },
    INACTIVE: {
      bg: 'bg-slate-100 border-slate-200 text-slate-500',
      label: 'Inactive'
    }
  };

  const current = config[normalized] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-600',
    label: status
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      {current.label}
    </span>
  );
};

export default StatusBadge;
