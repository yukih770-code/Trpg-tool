# Technology Radar + Future Bets v1

Status: Non-mandatory planning note.

This document is a technology radar, not an implementation contract. It does
not require the current codebase to adopt any listed technology immediately. It
exists to preserve long-term design space, help future planning, and prevent
short-term decisions from closing doors that the platform may need later.

Nothing in this note overrides Level 0 / Level 1 execution rules, architecture
contracts, data lifecycle policy, repository boundaries, or object ownership
boundaries. A future task must still state its scope explicitly before any
technology here can become implementation work.

## Categories

- Adopt: already adopted or worth continuing as a platform principle.
- Trial: suitable for isolated proof-of-concept work that must not pollute the
  product path.
- Observe: worth tracking, but not ready for platform implementation.
- Hold: explicitly deferred; do not implement now.

## Adopt

These are current platform principles or established directions that should
continue to guide implementation:

- Object Identity: separate `displayName` / `title`, internal ID, and
  publicCode.
- Export / Import Envelope for structured snapshots and dry-run import flows.
- Local-first backup / snapshot behavior before backend dependency.
- Repository Boundary between UI shells, local stores, future backend, and rule
  data.
- Projection / Visibility boundaries for owner/private/public views.
- AI draft is not a committed object until the user confirms it.
- `ActorVaultActor` != `CampaignActorInstance` != `RuntimeActor`.
- `Campaign Entry Draft` != `CampaignMembership`.
- `RuntimeLog` is not a Campaign Library owned object.
- `BlockDocument` and `MediaAsset` stay separate, with references rather than
  embedded media blobs.
- `WorkshopPackageManifest`, Source Settings, and dependency boundaries stay
  explicit.

## Trial

These are plausible future bets, but only as isolated PoCs unless a later task
promotes them into scoped implementation:

- PGlite / SQLite local repository PoC.
- BlockDocument CRDT PoC.
- Content hash for export package / Workshop package integrity.
- MCP-style AI tool interface mock.
- Map data model prepared for a Canvas / WebGPU renderer.

Trial work must be reversible, isolated, and explicitly labeled as a PoC. It
must not mutate production stores, schema, lifecycle behavior, or import/export
semantics unless a later implementation task says so directly.

## Observe

These areas are worth monitoring, but should not be implemented yet:

- CRDT / local-first sync ecosystem.
- Postgres sync / Electric-style sync.
- MCP ecosystem maturity.
- WebGPU for maps, fog of war, and token rendering.
- ActivityPub / ATProto for future community federation.
- Passkey support for a future account system.
- Browser-side local AI.

Observation means research and architectural awareness only. It is not approval
to add dependencies or product surfaces.

## Hold

These should not be implemented now:

- Full-platform CRDT conversion.
- Full-platform PGlite migration.
- Complete backend permission system.
- Complete federated community.
- Complex WebGPU map engine.
- Formal MCP server.
- Web3 / NFT asset system.
- Overwrite / Merge import as default behavior.

Hold items may be revisited only through an explicit architecture proposal and
implementation task. They must not arrive as incidental scope while working on a
nearby feature.

## Boundary Rules For Future Technology

Future technology must not bypass existing object boundaries:

- AI tools must not write committed objects directly. They must operate through
  draft / preview / confirmation flows.
- Sync, CRDT, backend, or local database work must preserve Actor / Campaign /
  Runtime layering.
- A future backend must not upgrade `selectedActorId` directly into
  `CampaignMembership`.
- `Campaign Entry Draft` remains a local entry preference until an explicit
  membership workflow commits it.
- `RuntimeActor` must not be treated as the same object as `ActorVaultActor` or
  `CampaignActorInstance`.
- `RuntimeLog` must remain a runtime/session record stream, not a Campaign
  Library owned object.
- Public codes are for user-owned or shareable objects. They do not apply to
  shared public rule catalog entries such as Spell, Class, Skill, Feat, Weapon
  template, Armor template, generic item template, or rule entries.
- Import flows must not make overwrite / merge the default behavior. Preview,
  dry-run, safe append, copy-as-new, and explicit confirmation remain the safer
  default direction.

## How To Use This Note

Use this radar when planning future work to ask:

1. Is this technology already an Adopt principle, or only a Trial / Observe /
   Hold item?
2. Does the task preserve object boundaries and data lifecycle boundaries?
3. Does the task remain local-first and reversible until a backend/sync contract
   exists?
4. Does the task avoid turning an AI preview, UI draft, or local runtime context
   into committed platform truth?

If the answer is unclear, write a small audit or contract update first. Do not
silently turn this radar into implementation scope.
