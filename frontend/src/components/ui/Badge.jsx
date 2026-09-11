import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  size = 'md', // 'sm' | 'md'
  className = ''
}) {
  const baseClasses = "inline-flex items-center justify-center font-bold uppercase tracking-widest border border-solid shadow-sm rounded-full";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[8px]",
    md: "px-3 py-1 text-[10px]"
  };

  const variantClasses = {
    success: "bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50",
    danger: "bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50",
    warning: "bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50",
    info: "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50",
    default: "bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}
