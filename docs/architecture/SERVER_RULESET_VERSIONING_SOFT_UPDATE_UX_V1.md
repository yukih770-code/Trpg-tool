# Server Ruleset Versioning & Soft Update UX — Contract v1 (P5.S1)

Architecture + type contract for how a World Server's ruleset is versioned, how
visual advanced-settings edits publish new versions, how campaigns/rooms pin
snapshots, and how the client applies updates **softly** without ever yanking an
editing user back to home. This is a contract for future PRs — **no UI, no DB, no
runtime, no permission, no API implementation here.** Type contract:
`src/lib/platform/serverRulesetVersioning.ts`, `src/lib/platform/softUpdatePolicy.ts`
(+ `serverRulesetVersioningSmoke.ts`).

## 1. Problem statement

Rules must not be hardcoded. Hosts change advanced rules, add species/classes/
monsters/items/maps via editors or imported packs, and adjust rule knobs — all
visually. But players are often mid-flow: building a character, prepping a campaign,
editing a log/map/compendium entry, or already at a live table. A server update must
never delete old data, never hard-refresh a dirty editor, and never kick a user to
the homepage. Already-preparing/playing tables must keep working under the ruleset
they started with, while new entrants get the right version or a clear prompt.

## 2. Product principles

Rules are data, not code. Advanced changes are visual/schema-driven. Server settings
are always accessible. Publishing advanced settings creates a **new server ruleset
version**; old versions and old pack versions remain available. Campaigns and runtime
rooms use **snapshots**. Running/preparing tables are never force-upgraded. Updates
are **soft by default** (a small top banner). Auto-refresh happens only on a safe,
non-dirty, refreshable route. Breaking changes require host/user review. Old data is
never deleted by a ruleset change.

## 3. Server ruleset version lifecycle

`draft → published → deprecated → archived` (`RulesetVersionStatus`). A host edits a
**draft** branched from the current published version (`basedOnVersionId`). Publishing
mints a new `ServerRulesetVersion` with an incremented `versionNumber`, a frozen
`rulesetTemplateId`, a pinned `enabledPackVersionIds` list, the `ruleKnobs` map, and a
computed `compatibility` summary. Superseded versions become `deprecated` (still
usable by existing snapshots), then `archived` (retained, not offered to new tables).
Nothing is deleted.

## 4. Visual advanced settings model

Advanced settings are `ruleKnobs: Record<string, unknown>` plus the set of enabled
pack versions — all edited through schema-driven UI, never code. Adding content
(species/classes/monsters/items/maps) means enabling a pack version or authoring one
in an editor; it never requires a platform code change. A settings edit accumulates
in a draft; publishing runs `summarizeRulesetCompatibility` and produces the next
version.

## 5. Ruleset template vs server ruleset config vs snapshot

Three distinct layers: (a) **ruleset template** — the immutable base system (e.g. DND
5e 2024) identified by `rulesetTemplateId`; (b) **server ruleset config/version** —
the host's knobs + enabled packs on top of a template, versioned per §3; (c)
**campaign/runtime snapshot** — a pinned reference to one published version
(`CampaignRulesetSnapshot`, `RuntimeRulesetSnapshot`) so a table is fully reproducible
and immune to later server publishes.

## 6. Safe / refresh-required / breaking changes

`classifyRulesetChange(descriptor)` → `RulesetChangeImpact`:
**safe** = additive only (new pack version added); existing tables keep working.
**refreshRequired** = compatible rule-knob changes a loaded client should reload to
pick up, but existing characters/rooms stay valid. **breaking** = template change,
pack removal/downgrade, or an incompatible knob change that can invalidate existing
characters/rooms — needs host review. Breaking wins over refreshRequired over safe.

## 7. Pack versioning and non-destructive data retention

`enabledPackVersionIds` pins exact pack versions. Upgrading a pack adds a new pack
version; the old one is retained and still referenced by existing snapshots. Removing
a pack is a breaking change but does not delete authored content — it only stops
offering that version to new versions. Compendium entries, actors, campaigns, assets,
logs, and generated artifacts authored under an old version remain valid and
readable.

## 8. Dirty state guard

`PageUpdateGuardState` captures the current route's `policy`, `hasDirtyDraft`,
`activeDraftIds`, and any loaded/locked version ids. `isRouteDirty` is true when
there is a dirty draft or any active draft id. This is the single source of truth the
soft-update layer consults before doing anything disruptive.

## 9. Soft update banner behavior

`createSoftUpdateNotice(impact, guard)` returns a `SoftUpdateNotice`
(`info | warning | blocking`) with intent `actions`. Default presentation is a small
top banner. It **never** offers a bare refresh to a dirty route — dirty routes get
`saveDraftThenRefresh`. Snapshot-locked routes get an informational "stays on
snapshot" notice with no forced action. Breaking changes are `blocking` and include
`hostMigrationRequired`.

## 10. Route preservation

`shouldAutoRefreshRoute(state)` returns true only when `policy === 'safeAutoRefresh'`,
the route is not dirty, and no runtime snapshot is locked. `deferUntilIdle` and
`snapshotLocked` never auto-refresh. The client must preserve the current route and
scroll/draft state; `returnToServerHome` (never the global homepage) is only ever an
explicit user choice, never an automatic redirect.

## 11. Character creation behavior

`character-create` routes declare `deferUntilIdle` and register a draft id. On a
server update they keep the draft and route; the banner offers `saveDraftThenRefresh`.
The in-progress character continues to validate against the loaded version until the
user chooses to move to the new one (where a recheck may apply on breaking changes).

## 12. Campaign creation behavior

Campaign creation/prep declares `deferUntilIdle` and pins a `CampaignRulesetSnapshot`
when saved. Preparing hosts keep their snapshot after a server publish; the banner is
non-blocking unless the change is breaking, in which case host review is offered.

## 13. Personal settings behavior

Personal/account settings are user-scoped and independent of server ruleset versions.
They declare `deferUntilIdle` while editing; a server update shows an info banner and
never discards unsaved settings.

## 14. Log editing behavior

Runtime-log editing (`runtimeLogLocalStore`) is draft-bearing and, when inside a live
room, `snapshotLocked`. It never auto-refreshes; edits persist under the room's
locked snapshot. RuntimeEvent history stays append-only (see P5.14).

## 15. Map/asset editing behavior

Map/asset editors declare `deferUntilIdle` with an active draft id. A pack/asset
update never rewrites an open editor; the banner defers until the draft is saved.
Asset metadata/blobs are unaffected (see P5.13 — metadata only, blobs never in
Postgres).

## 16. Compendium entry editing behavior

Compendium/pack editing declares `deferUntilIdle` with a draft id. Publishing a new
pack version is additive; the editor keeps working against the version it loaded. A
breaking server change surfaces `hostMigrationRequired` rather than discarding the
edit.

## 17. AI import draft behavior

AI-assisted import drafts (compendium import, generated NPC/scene drafts) are curated
`generated_artifacts`/drafts (see P5.15) and are draft-bearing. They declare
`deferUntilIdle`, never auto-refresh, and are saved before any refresh. No model is
called by this contract.

## 18. Room/lobby/runtime version mismatch behavior

`resolveRoomEntryMismatch(input)` → `VersionMismatchAction`. A live room with a
`RuntimeRulesetSnapshot` is authoritative on its locked snapshot: entrants
`loadSnapshotAndEnter`. A campaign-snapshot target that diverges from latest offers
`loadSnapshotAndEnter` (non-breaking) or `hostMigrationRequired` (breaking). A dirty
caller always `saveDraftThenRefresh`. Running/preparing tables are never force-
upgraded; the live Room Server remains runtime authority (see P5.14).

## 19. Migration report model

`RulesetCompatibilitySummary` is the migration report: `impact`, `requiresRoomReload`,
`requiresCharacterRecheck`, `requiresCompendiumReindex`, `requiresHostReview`, and
human-readable `notes`. It is produced deterministically by
`summarizeRulesetCompatibility` and is the payload a future migration/host-review UI
renders. It classifies; it does not mutate.

## 20. Future DB implications

Future tables (not in this PR): `world_servers`, `server_ruleset_versions`,
`ruleset_packs` / `pack_versions`, `campaign_ruleset_snapshots`,
`runtime_ruleset_snapshots`. These mirror the existing server-only slice pattern
(manual DDL, readiness helper, rollback smoke). `serverId` becomes a real FK; snapshots
reference published version ids. Non-destructive retention maps to soft-delete /
`archived_at`, never row deletion.

## 21. Future UI implications

A small top-banner component driven by `SoftUpdateNotice`; a route-guard hook reading
`PageUpdateGuardState`; a draft registry that reports `activeDraftIds`/`hasDirtyDraft`;
a host "advanced settings" schema-driven editor that publishes versions; and a
migration-review panel rendering `RulesetCompatibilitySummary`. None are implemented
here.

## 22. Risks

Future DB mapping may reshape these types; migration complexity grows with breaking
changes; conflicting concurrent drafts need a resolution policy; AI scope leakage
(P5.15 `visibility_scope` is still metadata-only) must be gated before AI retrieval;
public/private confusion (public entry ≠ public data; the Global Public Surface is not
a normal server); stale room snapshots may drift far from latest; and too many banners
risks UX overload — severities and dedup must be tuned.

## 23. Recommended next PRs

1. `world_servers` + `server_ruleset_versions` DDL + readiness + rollback smoke
   (server-only slice, mirroring P5.10–P5.15).
2. Campaign/runtime snapshot tables + pin-on-save/pin-on-start wiring (contract →
   persistence).
3. Draft registry + route-guard hook (frontend) consuming `PageUpdateGuardState`.
4. Soft-update banner component + server-version poll consuming `SoftUpdateNotice`.
5. Schema-driven advanced-settings editor that publishes versions and renders the
   `RulesetCompatibilitySummary` migration report.
