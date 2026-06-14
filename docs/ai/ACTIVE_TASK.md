# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: PlayMenu Dead Code Cleanup v1
- Name: PLAYMENU_DEAD_CODE_CLEANUP_V1
- Goal: Remove PlayMenu legacy path entirely. Delete import, JSX render block, dead playStage='menu' branch, dead i18n keys. Fix goUp to go to systemLibrary. Delete PlayMenu.tsx.
- Phase: P1 platform UX / IA
- Status: Done

## Result Summary

- **`src/App.tsx`**:
  - Removed `import { PlayMenu }` line
  - Updated sidebar landmark comment (kept PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR, updated description)
  - Updated goUp parent chain comment: `playMenu` → `systemLibrary`
  - `getParentNodeType` return type: `WorkspaceNodeType | 'playMenu'` → `WorkspaceNodeType | 'systemLibrary'`
  - `getParentNodeType` `'actorVault'` case: `return 'playMenu'` → `return 'systemLibrary'`
  - `goUp`: `if (parentType === 'playMenu') { setPlayStage('menu'); return; }` → `if (parentType === 'systemLibrary') { setAppView('systemLibrary'); return; }`
  - `enterPlay`: removed dead `else { setPlayStage('menu'); }` branch; added early `if (!system) return;` guard
  - Removed JSX block `{appView === 'play' && playStage === 'menu' && <PlayMenu .../>}`
- **`src/i18n/locales/zh-CN.ts`**: Removed entire `playMenu: { ... }` block (22 lines)
- **`src/i18n/locales/en.ts`**: Removed entire `playMenu: { ... }` block (22 lines)
- **`src/pages/PlayMenu.tsx`**: Deleted (no longer imported anywhere)
- **`playStage` / `PlayStage` type**: Retained — still used by `playStage === 'workspace'` workspace render branch
- **`navigation.backToSystemSelect`**: NOT removed — still used in workspace toolbar back button label
- No store / schema / migration / save format / rule data / React Router / URL routing / browser History API changed
- No SystemLibrary / Home / DND / COC / CP RED internal workspace changed

## Navigation

### Landmark

```text
AI-LANDMARK: PLAYMENU_DEAD_CODE_CLEANUP_V1  (new — docs only; no runtime marker file)
AI-LANDMARK: PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR  (updated comment — src/App.tsx)
```

### Locate Commands

```powershell
# Confirm PlayMenu fully gone from runtime:
rg "PlayMenu|playStage === 'menu'|setPlayStage\('menu'\)|选择规则系统|Choose a game system" src

# Confirm goUp goes to systemLibrary:
rg -n "systemLibrary" src/App.tsx
```
