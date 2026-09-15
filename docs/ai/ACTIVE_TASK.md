# Active Task

## Task

- ID: Platform Token Spatial Footprint / Bounds Contract V1
- Goal: add optional, versioned, server-readable Token footprints in Scene world units and deterministic generic bounds/separation without activating Game System combat rules.
- Phase: Platform spatial authority follow-up.
- Status: Completed; task work intentionally remains unstaged and uncommitted.

## Layer declaration

- Object: one optional `TokenSpatialFootprintV1` on `MapToken`; legacy `width`/`height` remain presentation-only compatibility fields.
- State: footprint travels in existing `map.token_added` / `map.token_updated` events and existing Scene snapshots; no SQL migration or new store.
- Authority: existing broad Token update permission; own-Token movement grants no footprint-edit authority.
- Rules boundary: axis-aligned world-space bounds and Euclidean geometric separation only. No D&D size, reach, range, diagonal, or attack legality.

## Allowed files

- `src/lib/map/tokenSpatialFootprint.ts` and focused smoke.
- `src/lib/map/mapRuntimeTypes.ts`, `mapRuntimeReplay.ts`, `useMapRuntimeBoard.ts` and focused smokes.
- `src/lib/scene/sceneRuntimeSnapshot.ts` and smoke.
- `server/services/appendRoomMapEvent.ts`, footprint authority/recovery smokes.
- `server/room/roomRuntimeVisibilityProjection.ts` and focused smoke.
- `src/components/platform/BasicMapBoard.tsx` for the existing GM Token editor and optional GM overlay.
- `docs/implementation/PLATFORM_TOKEN_SPATIAL_FOOTPRINT_V1.md` and the requested short Scene contract follow-up.
- `docs/ai/ACTIVE_TASK.md`, `docs/ai/TASK_ARCHIVE.md`.

## Forbidden changes

- D&D size mapping, weapon reach/range, T12 spatial rejection, spells, AoE, pathfinding, movement cost, collision, line of sight, cover, opportunity attacks, Fog of War, polygons, rotation, elevation, Mods, Workshop, scripting.
- Database schema or migrations.
- `scripts/dev-local.ps1`, `.work/`, `.yuki-*`, `Claude outputs/`, `output/`, `outputs/`, `tools/`, `work/`, and unrelated evidence.
- Staging, committing, or pushing footprint-task work.

## Completion criteria

- Optional validated footprint remains centered on canonical normalized Token position and resolves deterministic world bounds without DOM input.
- Two bounded Tokens expose generic overlap and nearest-boundary Euclidean separation.
- Legacy Tokens remain point-only; movement preserves dimensions and translates bounds.
- Existing map-event authorization, replay, projection, snapshots, reconnect, and PostgreSQL restart preserve footprint.
- Real GM UI edits footprint; player/spectator writes are denied; attack intent extras remain ignored.
- Focused regressions, TypeScript, server/frontend production builds, browser acceptance, restart recovery, and task-owned diff checks pass.
