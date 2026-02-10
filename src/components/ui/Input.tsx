'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-text-secondary mb-1">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-third focus:outline-none focus:border-accent transition-colors ${error ? 'border-red' : ''} ${suffix ? 'pr-16' : ''} ${className}`}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
