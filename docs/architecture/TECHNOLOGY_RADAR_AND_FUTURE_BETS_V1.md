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

Local-first backend is the first deployment mode, not the final architecture.
本地后端先行是第一部署形态，不是最终架构。 The platform should preserve room,
identity, repository, permission, import/export, and runtime boundaries so that
future deployment modes can share core data model and protocol concepts instead
of fragmenting into unrelated products.

Long-term deployment topology may include:

1. Local single-user mode / 本地单机.
2. LAN host mode / 局域网主持人开房.
3. Self-hosted dedicated server / 玩家或社群自托管服务器.
4. Official cloud service / 官方云端远程跑团服务.
5. Community or third-party servers / 第三方社区服务器.

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
- Multi-deployment topology boundary: the platform should preserve object,
  repository, room, identity, and permission boundaries so that local, LAN,
  self-hosted, official cloud, and future community servers can share the same
  core data model and protocol concepts.
- 多部署拓扑边界：平台不应被写死为纯本地工具或纯官方 SaaS。对象模型、
  Repository、房间、身份与权限边界应允许未来在本地、局域网、自托管、
  官方云和第三方社区服务器之间复用。

## Trial

These are plausible future bets, but only as isolated PoCs unless a later task
promotes them into scoped implementation:

- PGlite / SQLite local repository PoC.
- BlockDocument CRDT PoC.
- Content hash for export package / Workshop package integrity.
- MCP-style AI tool interface mock.
- Map data model prepared for a Canvas / WebGPU renderer.
- LAN room discovery PoC.
- Self-hosted backend skeleton PoC.
- Repository backend adapter PoC.
- Local backend + official cloud compatibility boundary.

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
- NAT traversal.
- WebRTC data channel.
- Reverse proxy deployment.
- Server federation.
- Community server registry.
- Cloud sync / local sync convergence.

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
- Full official cloud service.
- Full third-party server ecosystem.
- Complex federation protocol.
- Global server marketplace.

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
- Future cloud or server deployment must not collapse object boundaries.
- `roomCode` / `publicCode` is not a permission system.
- A local campaign is not automatically a cloud campaign.
- A LAN room is not automatically an official cloud room.
- `RuntimeActor` must not be persisted back into Campaign Library records.
- Official cloud support must not remove local export/import ownership.
- Self-hosted and community servers must not bypass visibility / projection /
  permission boundaries.
- 未来云端或服务器部署不得压平对象边界。
- `roomCode` / `publicCode` 不是权限系统。
- 本地战役不自动等于云端战役。
- 局域网房间不自动等于官方云房间。
- `selectedActorId` 不得直接升级成 `CampaignMembership`。
- `RuntimeActor` 不得写回 Campaign Library record。
- 官方云支持不得取消用户本地导出 / 导入与数据所有权。
- 自托管和第三方服务器不得绕过 visibility / projection / permission 边界。

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
