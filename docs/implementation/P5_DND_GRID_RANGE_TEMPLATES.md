# P5 DND Grid / Range / Templates

## Scope

This frontend slice adds tactical visualization helpers to the local DND map
board: a configurable grid, optional token snapping, temporary distance ruler,
and generic area templates. It is DM-assisted table support, not rules
authority.

## Grid and movement

The default grid is enabled at 50 pixels and 5 feet per square. Existing maps
without grid data load with that safe default. Hosts can toggle the grid, its
pixel size and scale, coordinates, and snapping. Snap uses grid centers.
Movement feedback and the ruler use straight-line Euclidean distance; no DND
diagonal variant is claimed or enforced.

## Ruler and templates

The ruler is temporary page state and does not append an event. Generic circle,
cone, line, square, and rectangle templates store only geometry, rotation,
optional label, and visibility. Hosts can add, move, rotate, remove, and clear
them. Grid/template state is included in `map.*` replay and scene snapshots.

## Runtime records

Persistent geometry uses `map.grid_updated`, `map.template_added`,
`map.template_updated`, `map.template_removed`, and `map.templates_cleared`.
Replay is sequence ordered and ignores unknown or incomplete geometry safely.

## Boundaries

The DM remains authority. Templates do not identify targets, apply damage,
modify HP, select spell effects, or encode official spell text. This adds no
line of sight, walls, fog, pathfinding, collision, backend API, database
migration, authentication, or WebSocket/LAN protocol change.

## Verification

Run `npm run frontend:verify:dnd-grid-range` together with existing map replay,
scene snapshot, combat, DND, campaign-room, local lobby, API, TypeScript, build,
and frontend secret-boundary checks.
