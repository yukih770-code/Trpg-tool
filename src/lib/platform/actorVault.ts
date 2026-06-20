/**
 * Platform Actor Vault Library Framework — type definitions.
 *
 * AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
 *
 * This module defines the platform-level abstractions for the Actor Vault Library.
 * Every game system (DND, COC, CP RED, and future systems) can implement an
 * ActorVaultAdapter<TActor> to plug into the shared ActorVaultLibraryShell UI.
 *
 * The shell only knows about ActorVaultSummary, ActorVaultStats, and ActorVaultAddOption.
 * It has no knowledge of system-specific rule fields (level, jobClass, race, SAN, role, etc.).
 * Those are mapped into the generic summary format by the system adapter.
 *
 * Supported actor kinds (for future extensibility — V1 only implements playerCharacter):
 *   playerCharacter | investigator | edgerunner | unit | vehicle | npc | companion | custom
 */

import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
} from './campaignFlow';

// ─── Core summary type ─────────────────────────────────────────────────────────

/**
 * System-agnostic representation of one actor in the vault library.
 * All system-specific fields are pre-mapped into detailFields / metaRows.
 */
export type ActorVaultSummary = {
  /** Stable actor id (from the system store) */
  id: string;
  /** Display name. Shown as the card heading. */
  displayName: string;
  /** Whether this actor is considered "complete" by system criteria. */
  completionStatus: 'complete' | 'incomplete';
  /** Whether this actor is currently active (the one being played / edited). */
  isActive: boolean;
  /**
   * Ordered list of key–value fields shown in the card's detail grid.
   * DND example: [{ label: 'Level', value: '5' }, { label: 'Class', value: 'Fighter / Battle Master' }, ...]
   */
  detailFields: ActorVaultDetailField[];
  /**
   * Small metadata row below the detail grid.
   * Used for source / creator / campaign provenance.
   */
  metaRows: ActorVaultMetaRow[];
  /** Position in the original list — used for 'default' (insertion-order) sort. */
  insertionOrder: number;
  /** Normalized name for localeCompare sort. */
  sortName: string;
  /**
   * Primary numeric value for numeric-descending sort.
   * DND: character level. COC: age or SAN (system decides). CP RED: role level.
   */
  sortNumeric: number;
};

export type ActorVaultDetailField = {
  label: string;
  value: string;
};

export type ActorVaultMetaRow = {
  label: string;
  value: string;
};

// ─── Library purpose ───────────────────────────────────────────────────────────

export type ActorVaultPurpose =
  | { kind: 'manage' }
  | { kind: 'selectForCampaign'; context: CampaignActorSelectReturnContext }
  | { kind: 'addForCampaign'; context: CampaignActorAddReturnContext };

// ─── Stats (vault homepage) ────────────────────────────────────────────────────

export type ActorVaultStats = {
  total: number;
  complete: number;
  incomplete: number;
  /** Optional label for the "recently updated" slot. Pass undefined to show '—'. */
  recentUpdatedLabel?: string;
};

// ─── Add options (delegated to onRequestAdd in V1) ────────────────────────────

export type ActorVaultAddOption = {
  id: string;
  label: string;
  description?: string;
  status: 'available' | 'planned' | 'disabled';
  onSelect: () => void;
};

// ─── Sort options ─────────────────────────────────────────────────────────────

export type ActorVaultSortOption = {
  key: string;
  label: string;
  /**
   * How the shell sorts by this key:
   *   'default'  → ascending insertionOrder
   *   'name'     → localeCompare(sortName)
   *   'numeric'  → descending sortNumeric
   */
  kind: 'default' | 'name' | 'numeric';
};

// ─── Adapter (system-specific glue) ───────────────────────────────────────────

/**
 * TActor is the system's actor store type (e.g. CharacterData for DND).
 *
 * The adapter is typically constructed in the system workspace shell using current
 * Zustand selectors, then passed to ActorVaultLibraryShell.
 * It is a plain object — no lifecycle, no hooks.
 */
export type ActorVaultAdapter<TActor> = {
  /** All actors in the system store (ordered by store insertion). */
  getActors(): TActor[];
  /** Currently active actor id, or null. */
  getActiveActorId(): string | null;
  /** Map one actor to a platform summary. index = position in getActors(). */
  getSummary(actor: TActor, index: number): ActorVaultSummary;
  /** Compute stats from an already-mapped summaries list. */
  getStats(summaries: ActorVaultSummary[]): ActorVaultStats;
  /** Add-entry options shown in the vault homepage "Add Actor" card (V1: delegated via onRequestAdd). */
  getAddOptions(): ActorVaultAddOption[];
  /** Sort options the library should offer. Must include at least one option. */
  getSortOptions(): ActorVaultSortOption[];
  /** Default sort key (must match one of getSortOptions()[].key). */
  getDefaultSortKey(): string;
  /** Called when the user clicks "Enter" on an actor card. */
  onEnterActor(id: string): void;
};

// ─── Convenience helper ────────────────────────────────────────────────────────

/**
 * Derive a mapped summaries list from an adapter.
 * Call this in a React component where the adapter is constructed from hooks.
 */
export function deriveVaultSummaries<T>(adapter: ActorVaultAdapter<T>): ActorVaultSummary[] {
  return adapter.getActors().map((actor, i) => adapter.getSummary(actor, i));
}

// ─── Color theme (Tailwind-class strings) ─────────────────────────────────────
//
// Define theme instances in .tsx files (so Tailwind scans the class strings).
// Pass the theme object as a prop to ActorVaultLibraryShell.

export type ActorVaultColorTheme = {
  /** Strong accent border — e.g. 'border-[#58180d]' */
  border: string;
  /** Light accent border — e.g. 'border-[#58180d]/30' */
  borderLight: string;
  /** Active card border — e.g. 'border-[#58180d]/50' */
  borderActive: string;
  /** Solid accent fill (active filter tab, active indicator) — e.g. 'bg-[#58180d]' */
  bgAccent: string;
  /** Active card background — e.g. 'bg-[#fff8e6]/90' */
  bgActive: string;
  /** Default card background — e.g. 'bg-white/55' */
  bgCard: string;
  /** Input / select field background — e.g. 'bg-white/80' for light themes, dark bg for dark themes */
  bgInput: string;
  /** Accent text — e.g. 'text-[#58180d]' */
  text: string;
  /** Muted accent text (labels, metadata) — e.g. 'text-[#58180d]/55' */
  textMuted: string;
  /** Text on solid accent background — e.g. 'text-[#fdf6e3]' */
  textInvert: string;
  /** Primary body text — e.g. 'text-[#2c1810]' */
  textBody: string;
  /** Hover background for ghost buttons — e.g. 'hover:bg-[#58180d]/10' */
  bgHover: string;
  /** Hover border class — e.g. 'hover:border-[#58180d]' */
  hoverBorder: string;
  /** Focus border class — e.g. 'focus:border-[#58180d]' */
  focusBorder: string;
  /** Hover text class — e.g. 'hover:text-[#58180d]' */
  hoverText: string;
};

// ─── Shell string labels ───────────────────────────────────────────────────────

export type ActorVaultShellStrings = {
  // Vault homepage
  existingActors: string;
  addActor: string;
  addActorNote: string;
  totalCount: string;
  completeCount: string;
  incompleteCount: string;
  recentUpdate: string;
  // Existing library view
  /** Parent level label for breadcrumb, e.g. '角色库'. No back action — informational only. */
  vaultBreadcrumbLabel: string;
  /** Brief subtitle shown under the existing-actors page title. */
  existingActorsSubtitle: string;
  /** @deprecated Kept for backwards-compat — no longer rendered as a back button. */
  backToLibrary: string;
  libraryTitle: string;
  searchPlaceholder: string;
  noResults: string;
  activeLabel: string;
  statusComplete: string;
  statusIncomplete: string;
  filterAll: string;
  filterComplete: string;
  filterIncomplete: string;
  enterActorLabel: string;
  campaignSelectionPrefix: string;
  campaignSelectionSuffix: string;
  campaignSelectionNote: string;
  returnToCampaignEntry: string;
  selectForCampaignLabel: string;
  selectCampaignLabel: string;
};
