# Continuation checkpoint — 2026-09-16

The earlier preimplementation handoff is superseded. **D&D Actor Size → Token Footprint Materialization V1 is implemented and verified, with no commit or staging.** Do not restart its audit or reimplement it.

Start with [the complete report](../implementation/DND_ACTOR_SIZE_FOOTPRINT_MATERIALIZATION_V1.md), including its A–V answers and evidence. HEAD remains `1073dbd`; source-changes.json identifies task-owned modifications and additions.

Locked principles: typed owner-approved D&D rules only; Character source passes through T11; Campaign override wins; server loads Actor authority; placement materializes once into generic Platform map state; explicit bounds/null and old Tokens remain untouched; replay never derives size or rolls; existing visibility policy stays authoritative. No SQL migration, T13/T14, ranged/thrown/reach expansion, movement redesign, Mods, or scripting was added.

Browser evidence covers PC/NPC automatic placement, accepted dagger action, adjacent/far range, 3×3 GM override after Actor Small size, clearing/reload, and backend recovery. Final recovered map sequence9 and RuntimeLog sequence6; repeated illegal dagger attack leaves log unchanged.

Local runtime caveat: configured localhost:55453 database was stopped. Docker startup also failed. Acceptance ran in an isolated PostgreSQL18 cluster using existing baseline migrations. Existing databases/.env were not changed. The new test harness can recreate an isolated fixture; it prints its temporary data path and supports restart/stop on stdin. This is not a claim that the user’s configured database was repaired.

Future work requires a new scope: source-backed Small/Medium choice for variable species; typed Monster catalog persistence; possibly an explicit D&D apply-default action for historical Tokens. Tiny/off-grid exact legality and larger spatial/combat mechanics remain deferred.

Preserve unrelated scripts/dev-local.ps1, .work/, .yuki-*, Claude outputs/, output/, outputs/, tools/, work/, and older evidence. Do not git add . / -A, clean, or hard reset. Current task forbids staging, committing, and pushing; checkpoint only if the user explicitly asks in a later turn.
