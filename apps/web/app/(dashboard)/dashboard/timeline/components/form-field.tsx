'use client';

import React, { useRef } from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* â”€â”€ Shared field wrapper â”€â”€ */

export interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {description && (
        <p className="mb-1.5 text-[11px] text-slate-400 dark:text-slate-500">{description}</p>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* â”€â”€ Shared input class strings â”€â”€ */

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800';

const errorBorder = 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700';

/* â”€â”€ TextInput â”€â”€ */

export interface TextInputProps extends Omit<FormFieldProps, 'children'> {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
}

export function TextInput({
  label,
  description,
  error,
  required,
  className,
  type = 'text',
  placeholder,
  value,
  onChange,
  maxLength,
  showCount,
  disabled,
}: TextInputProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`${inputBase} ${error ? errorBorder : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {showCount && maxLength != null && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </FormField>
  );
}

/* â”€â”€ TextArea â”€â”€ */

export interface TextAreaProps extends Omit<FormFieldProps, 'children'> {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
}

export function TextArea({
  label,
  description,
  error,
  required,
  className,
  placeholder,
  value,
  onChange,
  rows = 4,
  maxLength,
  showCount,
  disabled,
}: TextAreaProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={`${inputBase} resize-none ${error ? errorBorder : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {showCount && maxLength != null && (
          <span className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] text-slate-400 dark:text-slate-500">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </FormField>
  );
}

/* â”€â”€ Select â”€â”€ */

export interface SelectProps extends Omit<FormFieldProps, 'children'> {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  label,
  description,
  error,
  required,
  className,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: SelectProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputBase} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 ${error ? errorBorder : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

/* â”€â”€ DateInput â”€â”€ */

export interface DateInputProps extends Omit<FormFieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  includeTime?: boolean;
  disabled?: boolean;
}

export function DateInput({
  label,
  description,
  error,
  required,
  className,
  value,
  onChange,
  includeTime,
  disabled,
}: DateInputProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <input
        type={includeTime ? 'datetime-local' : 'date'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputBase} ${error ? errorBorder : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </FormField>
  );
}

/* â”€â”€ Toggle â”€â”€ */

export interface ToggleProps extends Omit<FormFieldProps, 'children'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({
  label,
  description,
  error,
  required,
  className,
  checked,
  onChange,
  disabled,
}: ToggleProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </FormField>
  );
}

/* â”€â”€ FileInput â”€â”€ */

export interface FileInputProps extends Omit<FormFieldProps, 'children'> {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function FileInput({
  label,
  description,
  error,
  required,
  className,
  accept,
  multiple,
  onFiles,
  disabled,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFiles(Array.from(e.target.files));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white/40 px-4 py-6 text-sm text-slate-500 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-400 ${
          error ? 'border-rose-300' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Upload className="h-5 w-5" />
        <span>Click to upload or drag and drop</span>
      </button>
    </FormField>
  );
}

/* â”€â”€ RadioGroup â”€â”€ */

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps extends Omit<FormFieldProps, 'children'> {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioGroup({
  label,
  description,
  error,
  required,
  className,
  options,
  value,
  onChange,
  disabled,
}: RadioGroupProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
              value === opt.value
                ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10'
                : 'border-slate-200 bg-white/40 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {opt.label}
              </span>
              {opt.description && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {opt.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </FormField>
  );
}

/* â”€â”€ ChipSelect (multi-select with chips) â”€â”€ */

export interface ChipSelectProps extends Omit<FormFieldProps, 'children'> {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function ChipSelect({
  label,
  description,
  error,
  required,
  className,
  options,
  selected,
  onChange,
  disabled,
}: ChipSelectProps) {
  const toggle = (val: string) => {
    if (disabled) return;
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val],
    );
  };

  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {active && <span className="h-1 w-1 rounded-full bg-emerald-500" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
