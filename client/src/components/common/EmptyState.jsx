import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at the moment.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-100 shadow-card py-16">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 text-slate-400 mb-4">
        <Icon className="h-8 w-8 text-brand-textLight" />
      </div>
      <h3 className="text-lg font-semibold text-brand-textDark mb-1">{title}</h3>
      <p className="text-sm text-brand-textLight max-w-sm mb-6">{description}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-teal rounded-lg hover:bg-brand-tealLight transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
