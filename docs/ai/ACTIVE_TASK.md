# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Campaign Vault + Source Settings + Workshop Scaffold Pattern Integration v1
- Name: CAMPAIGN_SOURCE_WORKSHOP_SCAFFOLD_PATTERN_V1
- Goal: Integrate Campaign Vault, Source Settings, Workshop Scaffold, and Developer Scaffold Mode principles into existing architecture contracts.
- Phase: P1 platform architecture
- Status: Done

## Result Summary

- `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`: added Campaign Vault / Source Settings / Workshop Scaffold principles near Game System Workspace Pattern.
- `UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md`: added Developer Scaffold Mode transparency rules under Planned / Future Action.
- Recorded that Actor Vault manages actors, Campaign Vault manages campaigns/rooms/long-term play spaces, Source Settings manages rules/extensions, Builder consumes Source Settings, Session Runtime consumes Campaign, and Workshop can feed all of them.
- Recorded Workshop item categories: Playable Asset, Table Asset, Creative Work, Creator Space, plus future `usageType` principle.
- No new architecture document and no `src/`, store, schema, migration, save format, runtime, dice, rule data, React Router, URL routing, or browser History API changes.

## Navigation

### Landmark

```text
AI-LANDMARK: CAMPAIGN_SOURCE_WORKSHOP_SCAFFOLD_PATTERN_V1
```

Located in:
- `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`
- `docs/architecture/UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md`

### Locate Commands

```powershell
rg -n "CAMPAIGN_SOURCE_WORKSHOP_SCAFFOLD_PATTERN_V1|Campaign Vault|Source Settings|Developer Scaffold Mode" docs/architecture docs/ai PROJECT_STATUS.md TEST_CHECKLIST.md
```
