import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  /** Colour accent: default 'yellow', 'green', 'blue', 'red', 'gray' */
  accent?: 'yellow' | 'green' | 'blue' | 'red' | 'gray';
  className?: string;
  onClick?: () => void;
}

const accentMap: Record<NonNullable<StatCardProps['accent']>, { icon: string; value: string; trend: string }> = {
  yellow: { icon: 'text-[#FFD700]', value: 'text-[#FFD700]', trend: 'text-[#FFD700]/70' },
  green:  { icon: 'text-green-400',  value: 'text-green-400',  trend: 'text-green-400/70' },
  blue:   { icon: 'text-blue-400',   value: 'text-blue-400',   trend: 'text-blue-400/70' },
  red:    { icon: 'text-red-400',    value: 'text-red-400',    trend: 'text-red-400/70' },
  gray:   { icon: 'text-gray-400',   value: 'text-gray-300',   trend: 'text-gray-500' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'yellow',
  className = '',
  onClick,
}: StatCardProps) {
  const colors = accentMap[accent];

  const content = (
    <div className={`luxe-card p-4 sm:p-6 ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        {icon && <span className={`flex-shrink-0 ${colors.icon}`}>{icon}</span>}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold luxe-title ${colors.value} mb-1`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 font-normal">{subtitle}</p>
      )}
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${colors.trend}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}
          {trend.label ? ` ${trend.label}` : ''}
        </p>
      )}
    </div>
  );

  return onClick ? <button onClick={onClick} className="text-left w-full">{content}</button> : content;
}
