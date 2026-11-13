import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  size = 'md', // 'sm' | 'md'
  className = ''
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wide";

  // 10px is the floor for legibility (was 8px).
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-[11px]"
  };

  const variantClasses = {
    success: "bg-positive-soft text-positive",
    danger: "bg-negative-soft text-negative",
    warning: "bg-warn-soft text-warn",
    info: "bg-brand-navy-50 text-brand-navy dark:bg-brand-navy-200/10 dark:text-brand-navy-200",
    default: "bg-hover text-ink-2"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}
