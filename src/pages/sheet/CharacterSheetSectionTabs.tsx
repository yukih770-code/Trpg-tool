/**
 * CharacterSheetSectionTabs
 *
 * Shared, system-agnostic section-tab control for character sheets
 * (DND 5e 2024 / COC 7e / Cyberpunk RED). Implements phase 1 of the
 * Character Sheet UX Contract: tabs/sections only — no rule data, no store
 * writes, no runtime/gameplay behavior.
 *
 * Each system page supplies its own section definitions and theme classes and
 * controls `activeId` itself, then renders the matching section content. This
 * component only renders the selectable tab bar; it does not own which content
 * shows (the page gates content by activeId).
 */

export type CharacterSheetSectionId =
  | 'overview'
  | 'features'
  | 'skills'
  | 'equipment'
  | 'spellbook'
  | 'background'
  | 'notes'
  | 'gear'
  | 'cyberware'
  | 'role';

export interface CharacterSheetSectionDefinition {
  /** Stable section key. Use a CharacterSheetSectionId where possible. */
  id: string;
  label: string;
  description?: string;
}

export interface CharacterSheetSectionTabsProps {
  sections: CharacterSheetSectionDefinition[];
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible label for the tablist. */
  ariaLabel?: string;
  className?: string;
  /** Classes applied to the selected tab. */
  activeTabClassName?: string;
  /** Classes applied to unselected tabs. */
  inactiveTabClassName?: string;
  /** Show the active section's description under the tab bar when present. */
  showActiveDescription?: boolean;
}

const DEFAULT_ACTIVE_TAB =
  'border-current bg-current/10 font-bold opacity-100 shadow-sm';
const DEFAULT_INACTIVE_TAB =
  'border-transparent opacity-55 hover:opacity-90 hover:border-current/30';

export function CharacterSheetSectionTabs({
  sections,
  activeId,
  onChange,
  ariaLabel = 'Character sheet sections',
  className,
  activeTabClassName = DEFAULT_ACTIVE_TAB,
  inactiveTabClassName = DEFAULT_INACTIVE_TAB,
  showActiveDescription = false,
}: CharacterSheetSectionTabsProps) {
  const activeSection = sections.find((section) => section.id === activeId);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 overflow-x-auto"
      >
        {sections.map((section) => {
          const selected = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={selected}
              title={section.description ?? section.label}
              onClick={() => onChange(section.id)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                selected ? activeTabClassName : inactiveTabClassName
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      {showActiveDescription && activeSection?.description && (
        <p className="mt-2 text-[11px] leading-relaxed opacity-70">
          {activeSection.description}
        </p>
      )}
    </div>
  );
}
