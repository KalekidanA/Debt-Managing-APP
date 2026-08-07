interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export function ProgressBar({ value, className = "", trackClassName = "", fillClassName = "" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-primary-soft ${trackClassName} ${className}`}>
      <div
        className={`h-full rounded-full bg-primary transition-[width] duration-500 ease-out ${fillClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
