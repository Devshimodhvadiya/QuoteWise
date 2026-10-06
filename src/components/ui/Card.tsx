import React from 'react';
import { cn } from '../../utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ className, children, padding = 'md' }) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', paddings[padding], className)}>
      {children}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'green' | 'blue' | 'amber' | 'red';
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendUp,
  color = 'indigo',
}) => {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        {trend && (
          <p className={cn('mt-1 text-xs font-medium', trendUp ? 'text-green-600' : 'text-red-500')}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={cn('flex-shrink-0 p-2.5 rounded-lg', colorMap[color])}>
        {icon}
      </div>
    </Card>
  );
};
