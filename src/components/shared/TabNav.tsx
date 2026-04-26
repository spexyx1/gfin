import React from 'react';

export interface TabDef<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface TabNavProps<T extends string = string> {
  tabs: TabDef<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  /** Direction: horizontal (default) or vertical */
  direction?: 'horizontal' | 'vertical';
  /** Size: sm, md (default) */
  size?: 'sm' | 'md';
}

export function TabNav<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  direction = 'horizontal',
  size = 'md',
}: TabNavProps<T>) {
  const isActive = (id: T) => activeTab === id;

  const base = direction === 'horizontal'
    ? `flex flex-wrap gap-1 ${className}`
    : `flex flex-col gap-1 ${className}`;

  const btnBase = size === 'sm'
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all'
    : 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all';

  const active = 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30';
  const inactive = 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent';

  return (
    <nav className={base} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive(tab.id)}
          onClick={() => onChange(tab.id)}
          className={`${btnBase} ${isActive(tab.id) ? active : inactive}`}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
              isActive(tab.id) ? 'bg-[#FFD700]/30 text-[#FFD700]' : 'bg-white/10 text-gray-400'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
