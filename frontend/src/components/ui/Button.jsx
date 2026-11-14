import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'onDark'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  // press + btn-step: steps up 1px on hover, sinks 1px and scales .985 on press.
  const baseClasses = "press btn-step group inline-flex items-center justify-center rounded-xl font-medium disabled:cursor-not-allowed disabled:opacity-55";

  const sizeClasses = {
    sm: "min-h-9 px-3 py-1.5 text-[13px] gap-1.5",
    md: "min-h-11 px-5 py-2.5 text-sm gap-2",
    lg: "min-h-12 px-6 py-3 text-[15px] gap-2.5"
  };

  // Primary is the palette's action colour: gold with near-black ink (10.7:1).
  // On hover each fill steps toward the ink.
  const variantClasses = {
    primary: "bg-brand-gold text-brand-dark hover:bg-brand-gold-500 shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)]",
    secondary: "bg-hover text-ink hover:bg-line",
    danger: "bg-brand-red text-white hover:bg-brand-red-800",
    outline: "border border-line bg-panel text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink",
    ghost: "bg-transparent text-ink-2 hover:bg-hover hover:text-ink",
    onDark: "border border-white/20 bg-white/[0.06] text-white hover:border-white/40 hover:bg-white/[0.12]"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <FiLoader className="animate-spin" size={size === 'sm' ? 14 : 18} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
