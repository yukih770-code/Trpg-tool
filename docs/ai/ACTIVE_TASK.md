# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Workshop Full Interface Scaffold v1
- Name: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1
- Goal: Build the full Workshop frontend framework and interface skeleton. Type system overhaul, action interface stubs, browse with search/system/category/subtype/attributeTags/shape/sort, card metadata upgrade (author/version/depStatus/impactScope/attributeTags), quick preview panel, subscription profile block, subscriptions UX with full metadata badges.
- Phase: P1 platform UX / IA
- Status: Done

## Result Summary

- **`src/lib/platform/workshopTypes.ts`**: Full rewrite (supersedes WORKSHOP_BROWSE_SUBSCRIPTIONS_UX_REFINEMENT_V1)
  - New types: `WorkshopImpactScope`, `WorkshopDependencyStatus`, `WorkshopActionResult`, `WorkshopActions`
  - New constant: `WORKSHOP_ATTRIBUTE_TAGS` (per-category attribute tag arrays)
  - `WORKSHOP_ACTION_STUBS`: concrete stub returning `{ ok:false, status:'reserved' }` for all actions
  - Updated `WORKSHOP_SUBTYPES`: restructured per-category (character→presetCharacter/buildGuide/…; ruleContent→rulePackage/characterOption/…; mapScene→dungeonMap/buildingMap/…; toolTemplate now non-empty)
  - Updated `WORKSHOP_LANDING_MAP`: creatureNpc→npcLibrary, toolTemplate→toolLibrary; added npcLibrary/moduleLibrary/toolLibrary to `WorkshopLandingTarget`
  - `WorkshopBrowseItem` extended: `author`, `description`, `attributeTags`, `version`, `lastUpdatedLabel`, `dependencyStatus`, `impactScope`
  - `WorkshopSubscriptionItem` extended: `author`, `version`, `lastUpdatedLabel`, `dependencyStatus`, `impactScope`
  - 6 browse samples + 4 subscription samples with full metadata
- **`src/components/platform/WorkshopShell.tsx`**: Full rewrite
  - New state: `activeAttributeTag`, `previewId`
  - Attribute tags filter row added inside subtype sub-panel (per-category tags from `WORKSHOP_ATTRIBUTE_TAGS`)
  - Quick preview panel: page-internal, appears between filter card and browse grid; shows all metadata fields + description
  - Subscription profile block: lightweight line at top of subscriptions tab
  - Browse cards: author, version, lastUpdated, attributeTags chips, impactScope (if notable), quickPreview toggle button
  - Subscription items: extended metadata row (version/lastUpdated/dependencyStatus/impactScope)
  - `SubPanelRow` helper component for label-less chip rows inside sub-panel
  - Search now covers author, subtype, attributeTags, category, system fields
- **`src/i18n/locales/zh-CN.ts`**: workshop block replaced
  - Added: `filter.attributeTag.*` (all per-category attribute tag labels)
  - Added: `impactScope.*`, `dependencyStatus.*`
  - Added: `card.quickPreview`, `card.closePreview`, `card.author`, `card.version`, `card.lastUpdated`, `card.dependencyStatus`, `card.impactScope`, `card.attributeTags`, `card.previewInterfaceNote`
  - Added: `landing.npcLibrary`, `landing.moduleLibrary`, `landing.toolLibrary`
  - Added: `subscriptions.profile.*`, `subscriptions.versionLabel`, `subscriptions.lastUpdatedLabel`, `subscriptions.dependencyStatusLabel`, `subscriptions.impactScopeLabel`
  - Updated `filter.subtype.*`: new taxonomy (presetCharacter/buildGuide/characterBackground/artworkBound/organizationMember/characterOption/spellAbility/equipmentItem/creatureRule/referenceTable/dungeonMap/buildingMap/wildernessMap/worldMap/scenePack/singleAdventure/investigationScript/macro/generatorTemplate/characterSheetTemplate/quickReference/gmTool/playerTool)
- **`src/i18n/locales/en.ts`**: Mirror of zh-CN changes
- No store / schema / migration / save format / rule data / Builder / dice / runtime / Campaign / Module / Session / React Router / URL routing / browser History API changed
- No Actor Vault / System Library / DND / COC / CP RED internal workspace changed

## Navigation

### Landmark

```text
AI-LANDMARK: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1
```

### Locate Commands

```powershell
# Confirm attribute tags present:
rg "WORKSHOP_ATTRIBUTE_TAGS|activeAttributeTag" src/components/platform/WorkshopShell.tsx

# Confirm quick preview state:
rg "previewId|previewItem|quickPreview" src/components/platform/WorkshopShell.tsx

# Confirm subscription profile block:
rg "profile\.label|profile\.default|profile\.configReserved" src/components/platform/WorkshopShell.tsx

# Confirm action stubs:
rg "WORKSHOP_ACTION_STUBS|WorkshopActions" src/lib/platform/workshopTypes.ts

# Confirm new subtype taxonomy:
rg "presetCharacter|characterOption|dungeonMap|investigationScript" src/lib/platform/workshopTypes.ts

# Confirm extended browse item metadata:
rg "author|version|impactScope|dependencyStatus" src/lib/platform/workshopTypes.ts
```
