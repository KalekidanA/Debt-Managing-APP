import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  fieldPrefix?: ReactNode;
}

export function Field({ label, hint, fieldPrefix, className = "", id, ...props }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring">
        {fieldPrefix && <span className="text-sm text-muted-foreground">{fieldPrefix}</span>}
        <input
          id={inputId}
          className={`w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground ${className}`}
          {...props}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  id?: string;
}

export function Select({ label, value, onChange, options, id }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={selectId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
