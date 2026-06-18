import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'teal' }) => {
  const sizeClasses = {
    small: 'h-5 w-5 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    teal: 'border-brand-teal/20 border-t-brand-teal',
    navy: 'border-brand-navy/20 border-t-brand-navy',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="loading"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
