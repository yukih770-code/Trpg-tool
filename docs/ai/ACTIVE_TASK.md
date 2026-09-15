# Active Task

## Task

- ID: D&D Spatial Attack Legality V1
- Goal: consume authoritative Platform Scene/Token bounds in a D&D-owned tri-state legality seam and reject supported out-of-range melee attacks before T12 RNG.
- Phase: D&D runtime legality integration.
- Status: Complete; focused and broad regressions, TypeScript, production builds, real-browser boundary acceptance, PostgreSQL restart recovery, and the post-restart repeated rejection pass.

## Layer declaration

- Platform inputs: replayed `SceneSpatialV1`, canonical Token centers, `TokenSpatialFootprintV1` bounds, and combatant `mapTokenId` links.
- D&D interpretation: approved 5-foot square grid, shortest adjacent-square distance across occupied spaces, canonical weapon-mode reach, and `legal | illegal | unavailable`.
- T12 integration: canonical action and target are resolved before the spatial seam; only `illegal` returns `dnd_attack_out_of_range`; `unavailable` preserves GM adjudication.
- Actor size: accepted Character and monster size are free text and Runtime projection omits size, so no size-to-footprint adapter or automatic materialization is enabled.

## Allowed files

- `src/lib/dnd2024/gameplay/dndWeaponRangeSource.ts`, `dndWeaponAttackModes.ts`, `dndSpatialAttackLegality.ts`.
- Focused D&D mode/spatial smoke files.
- `server/services/resolveDndSpatialAttackLegality.ts`, `declareDndAttack.ts`, focused authority smoke.
- `src/components/platform/RuntimeDndActionPanel.tsx` and its focused rendering smoke for concise range rejection text.
- `package.json` for focused verification commands.
- Requested implementation documents and AI task lifecycle files.

## Forbidden changes

- Platform geometry rules, Actor/Character schema, migration, ranged/thrown/reach execution, ammunition/loading, long-range disadvantage, spell range, AoE, cover, line of sight, movement/pathfinding/collision, opportunity attacks, Fog of War, Mods, Workshop, scripting.
- Automatic or live Actor-size inheritance for Tokens.
- `scripts/dev-local.ps1`, `.work/`, `.yuki-*`, `Claude outputs/`, `output/`, `outputs/`, `tools/`, `work/`, and unrelated evidence.
- Staging, committing, or pushing this task.

## Key symbols

- `evaluateDndSpatialAttackLegality`
- `resolveAuthoritativeDndSpatialAttackLegality`
- `declareDndAttack`
- `getDndWeaponAttackModeByActionId`
- `DND_2024_GRID_CELL_DISTANCE_FEET`

## Locate commands

- `rg -n "evaluateDndSpatialAttackLegality|resolveAuthoritativeDndSpatialAttackLegality|dnd_attack_out_of_range" src server`
- `rg -n "DND_2024_GRID_CELL_DISTANCE_FEET|movementAndPosition" src/lib/dnd2024/gameplay`

## Completion criteria

- All four current canonical simple-melee modes use source-backed square-grid legality without weapon-name branches.
- Illegal attacks consume no RNG and mutate no HP/RuntimeLog state; HTTP returns stable 409 rejection.
- No Scene, missing footprint, unsupported mode/geometry, ambiguous link, or incompatible scale remains `unavailable` and preserves existing T12 behavior.
- T11, campaign override, visibility, idempotency/replay, Scene/footprint recovery, TypeScript, server/frontend builds, real browser sequence, and backend restart pass.
- No migration; task files remain unstaged and uncommitted.
