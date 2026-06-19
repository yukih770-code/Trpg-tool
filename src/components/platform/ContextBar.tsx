import { ArrowLeft } from 'lucide-react';

type ContextBarProps = {
  label: string;
  backLabel: string;
  status?: string;
  onBack?: () => void;
  className?: string;
};

export function ContextBar({
  label,
  backLabel,
  status,
  onBack,
  className = '',
}: ContextBarProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${className}`}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          title={backLabel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-current bg-transparent transition hover:opacity-75"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1 truncate font-bold">{label}</div>
      {status ? (
        <span className="shrink-0 rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
          {status}
        </span>
      ) : null}
    </div>
  );
}
