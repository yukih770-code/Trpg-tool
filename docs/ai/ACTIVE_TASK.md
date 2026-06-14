# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Actor Vault Dead I18n Key Cleanup v1
- Name: ACTOR_VAULT_DEAD_I18N_CLEANUP_V1
- Goal: Remove all dead i18n keys left over from the three-system Actor Vault migration (DND / COC / CP RED).
- Phase: P1 platform i18n hygiene
- Status: Done

## Result Summary

- Removed ~60 dead keys across `zh-CN.ts` and `en.ts`.
- Sections cleaned: `multiWorkspace.actions` (5 dead keys), `multiWorkspace.singleActor` (entire block), `multiWorkspace.actorVault` (5 dead keys), `multiWorkspace.entryPattern` (entire block), `multiWorkspace.coc.home` (3 dead keys), `multiWorkspace.coc.modules` (entire block), `multiWorkspace.coc.notes` (entire block), `multiWorkspace.coc.entry` (4 dead keys), `multiWorkspace.cp.home` (3 dead keys), `multiWorkspace.cp.modules` (entire block), `multiWorkspace.cp.notes` (entire block), `multiWorkspace.cp.entry` (4 dead keys), `cocWorkspace.nav` (6 → 1, kept `sheet`), `cpWorkspace.nav` (entire block), `cpWorkspace.vault` (entire block), `dndWorkspace.home` (4 dead keys), `dndWorkspace.modules` (10 → 4, kept `spellIndex/featIndex/equipmentIndex/classIndex`), `dndWorkspace.characters` (7 → 7 alive fields, removed 7 dead fields).
- No `src/pages/`, `src/components/`, `src/lib/`, store, schema, migration, save format, or routing files modified.
- All removed keys confirmed dead via `rg` (zero non-i18n src/ references).

## Navigation

### Landmark

```text
AI-LANDMARK: ACTOR_VAULT_DEAD_I18N_CLEANUP_V1
```

Located in: `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts` (absence of removed keys; no inline landmark comment needed for deletion tasks).

### Locate Commands

```powershell
# Confirm cleaned keys are gone
rg "vaultTitle|singleActorLimitNote|campaignTeaser|entryPattern|replaceCurrentCharacter|continueInvestigatorEditing|emptyTitle.*角色" src/i18n/

# Confirm alive keys still present
rg "continueEdgerunnerEditing|actorVault\.existingActors|cocWorkspace\.nav\.sheet" src/i18n/
```
