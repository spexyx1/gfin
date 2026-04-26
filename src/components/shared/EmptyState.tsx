import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      {icon && (
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-gray-400">{icon}</span>
        </div>
      )}
      <h3 className="text-lg luxe-title text-neon-yellow mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm font-normal max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 luxe-btn-primary px-6 py-2.5 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
