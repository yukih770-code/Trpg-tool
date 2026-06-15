# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Workshop Browse + Subscriptions UX Refinement v1
- Name: WORKSHOP_BROWSE_SUBSCRIPTIONS_UX_REFINEMENT_V1
- Goal: Reduce top tabs to 浏览/我的订阅 (remove 更新与依赖). Add filter visual hierarchy (basicSection/advancedSection, subtype nesting). Add 6 browse samples + 4 subscription samples with status badges. Redesign Subscriptions as item-level list with badges/landing/search/filters. Update i18n + docs.
- Phase: P1 platform UX / IA
- Status: Done

## Result Summary

- **`src/lib/platform/workshopTypes.ts`**: Full rewrite (supersedes TAXONOMY_CLEANUP_V1)
  - Added `WorkshopSubscriptionStatusKey`, `WORKSHOP_SUBSCRIPTION_STATUS_KEYS`, `WORKSHOP_SUBSCRIPTION_SAMPLES`
  - `WorkshopSubscriptionItem` now includes `landing: WorkshopLandingTarget` + `status: WorkshopSubscriptionStatusKey`
  - 6 browse samples (dnd-expansion-rules, castle-investigation-maps, night-city-ambience, dnd-starter-character-template, coc-investigator-npc-pack, random-encounter-template)
  - 4 subscription samples (ok, hasUpdate, ok, possibleConflict)
  - `WORKSHOP_LANDING_MAP` and `WORKSHOP_SUBTYPES` unchanged
- **`src/components/platform/WorkshopShell.tsx`**: Full rewrite
  - `WorkshopTab = 'browse' | 'subscriptions'` (updates tab removed)
  - Filter card split into 基础筛选 (system + category + subtype nesting) / 高级筛选 (shape + sort) sections
  - Subtype sub-panel: `ml-[88px]` indent + left border + currentCategoryLabel header + subtypeRowLabel row
  - `statusBadgeCls()` for 7 status badge colors
  - `cardLanding()` / `subLanding()` helpers (systemRuleSources → prepends system name)
  - Browse cards show `card.landing` field
  - Subscriptions tab: search input + status filter + category filter + item list with badges + landingFootnote + preflightNote
- **`src/i18n/locales/zh-CN.ts`**: workshop block replaced
  - Added: filter.basicSection, filter.advancedSection, filter.subtype.currentCategoryLabel/subtypeRowLabel/randomTable, card.landing
  - Removed: tabs.updates, landingTitle, subscriptions.statusReserved/cancelReserved, updates.*
  - Added: subscriptions.search.placeholder, subscriptions.filterStatus, subscriptions.statusFilter.*, subscriptions.badge.*, subscriptions.manageReserved, subscriptions.noResults, subscriptions.statusNote, subscriptions.preflightNote, subscriptions.landingFootnote
- **`src/i18n/locales/en.ts`**: Mirror of zh-CN changes
- No store / schema / migration / save format / rule data / Builder / dice / runtime / Campaign / Module / Session / React Router / URL routing / browser History API changed
- No Actor Vault / System Library / DND / COC / CP RED internal workspace changed

## Navigation

### Landmark

```text
AI-LANDMARK: WORKSHOP_BROWSE_SUBSCRIPTIONS_UX_REFINEMENT_V1
```

### Locate Commands

```powershell
# Confirm updates tab removed:
rg "updates|更新与依赖" src/components/platform/WorkshopShell.tsx

# Confirm filter sections present:
rg "basicSection|advancedSection|currentCategoryLabel|subtypeRowLabel" src/components/platform/WorkshopShell.tsx

# Confirm status badge helper:
rg "statusBadgeCls|WorkshopSubscriptionStatusKey" src/components/platform/WorkshopShell.tsx

# Confirm subscription samples:
rg "WORKSHOP_SUBSCRIPTION_SAMPLES|sub\." src/lib/platform/workshopTypes.ts
```
