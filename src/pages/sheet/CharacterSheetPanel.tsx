import type { ReactNode } from 'react';

/**
 * CharacterSheetPanel
 *
 * Lightweight, system-agnostic presentational card for character-sheet sections.
 * Provides a consistent eyebrow / title / description / aside header plus a body,
 * so sheet sections read like "pages" instead of flat data tables.
 *
 * Display only: no rule data, no store writes, no runtime/gameplay behavior.
 * Theme colors are supplied by the caller via className / headerClassName so the
 * same component fits DND / COC / CP RED without erasing system identity.
 */
export interface CharacterSheetPanelProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional right-aligned header slot (e.g. a small read-only note or chip). */
  aside?: ReactNode;
  /** Outer container classes (border / background tint). */
  className?: string;
  /** Title color / accent classes. */
  headerClassName?: string;
  /** Extra classes for the body wrapper. */
  bodyClassName?: string;
  children: ReactNode;
}

export function CharacterSheetPanel({
  eyebrow,
  title,
  description,
  aside,
  className,
  headerClassName,
  bodyClassName,
  children,
}: CharacterSheetPanelProps) {
  return (
    <section className={`rounded-lg border p-4 shadow-sm ${className ?? ''}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-current/10 pb-2">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-55">
              {eyebrow}
            </div>
          )}
          <h3 className={`text-sm font-black uppercase tracking-wide ${headerClassName ?? ''}`}>
            {title}
          </h3>
          {description && (
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed opacity-65">{description}</p>
          )}
        </div>
        {aside && <div className="shrink-0 text-right">{aside}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
