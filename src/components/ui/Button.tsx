import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', loading = false, disabled, icon, ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm border border-transparent focus-visible:ring-emerald-500',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 focus-visible:ring-slate-400',
      outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus-visible:ring-emerald-500 shadow-sm',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-transparent focus-visible:ring-rose-500',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
      link: 'bg-transparent text-emerald-600 hover:underline p-0 h-auto font-medium',
    }[variant];

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5',
      md: 'px-3.5 py-2 text-sm font-medium rounded-lg gap-2',
      lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer',
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
