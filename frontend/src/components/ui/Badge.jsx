import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  size = 'md', // 'sm' | 'md'
  dot = false, // a small status dot before the text
  className = ''
}) {
  // Sentence case, 12px at the smallest: easier to read than tiny capitals.
  const baseClasses = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-[13px]"
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
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
