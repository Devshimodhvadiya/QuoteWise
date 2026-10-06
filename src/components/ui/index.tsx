import React from 'react';
import { cn } from '../../utils';
import type { RequirementStatus } from '../../types';
import { getStatusColor } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className }) => (
  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', className)}>
    {children}
  </span>
);

export const StatusBadge: React.FC<{ status: RequirementStatus }> = ({ status }) => (
  <Badge className={getStatusColor(status)}>{status}</Badge>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="text-slate-300 mb-4">{icon}</div>
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, breadcrumb }) => (
  <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
    {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </div>
);

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={cn('border-2 border-indigo-600 border-t-transparent rounded-full animate-spin', sizes[size], className)} />
  );
};

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <LoadingSpinner size="lg" />
  </div>
);

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cn('relative', className)}>
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300 transition-colors"
    />
  </div>
);
