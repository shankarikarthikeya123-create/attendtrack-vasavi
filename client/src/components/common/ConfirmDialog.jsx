import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info'
}) => {
  const typeColors = {
    warning: {
      iconBg: 'bg-amber-50 text-amber-500',
      btnBg: 'bg-brand-accent hover:bg-brand-accentLight focus:ring-brand-accent',
    },
    danger: {
      iconBg: 'bg-rose-50 text-rose-500',
      btnBg: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500',
    },
    info: {
      iconBg: 'bg-brand-skyBg text-brand-navy',
      btnBg: 'bg-brand-navy hover:bg-brand-navyDark focus:ring-brand-navy',
    },
  };

  const currentColors = typeColors[type] || typeColors.warning;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`flex items-center justify-center h-12 w-12 rounded-full mb-4 ${currentColors.iconBg}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-brand-textMedium mb-6">{message}</p>
        <div className="flex w-full space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2 px-4 text-sm font-semibold text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentColors.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
