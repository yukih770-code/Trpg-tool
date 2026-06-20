# Reference Architecture Application Guide v1

Status: guidance / coding constraint document.

Scope: Chinese multi-system TRPG platform covering DND, COC, CP RED, Actor Vault, Campaign Vault, character sheets, packages, BlockDocument, MediaAsset, Campaign Runtime Shell, and future map, handout, runtime log, multiplayer, backend, and AI Host work.

This document converts lessons from mature projects and technical families into project-specific coding rules. It is not a dependency decision and does not approve installing new libraries.

## 1. Purpose

This guide exists to prevent architecture drift when future work adds maps, handouts, package imports, campaign runtime, multiplayer, backend repositories, or AI-hosted tools.

Before implementation, contributors and coding agents must identify:

- which object layer is being changed;
- which state layer is being used;
- whether a value is suggested, selected, owned, runtime-only, persisted, projected, or authoritative;
- whether a feature is placeholder UI or real behavior;
- whether system-specific DND / COC / CP RED logic is leaking into the platform layer.

## 2. External References Studied

These references were checked for architecture ideas, not for code copying.

- Foundry VTT / Foundry VTT DND5e: official Foundry API and system documentation were checked for Actor, Item, Compendium, and system separation concepts.
  - https://foundryvtt.com/article/systems/
  - https://foundryvtt.com/api/classes/foundry.documents.Actor.html
  - https://foundryvtt.com/api/classes/foundry.documents.Item.html
  - https://foundryvtt.com/api/classes/foundry.documents.CompendiumCollection.html
- tldraw: official docs were checked for Editor, records, store schema, shapes, bindings, assets, pages, history, and collaboration concepts.
  - https://tldraw.dev/docs/editor
  - https://tldraw.dev/reference/store/StoreSchema
- Yjs / CRDT: official Yjs docs were checked for shared map, array, and text types.
  - https://docs.yjs.dev/api/shared-types/y.map
  - https://docs.yjs.dev/api/shared-types/y.array
  - https://docs.yjs.dev/api/shared-types/y.text
- TanStack Router: official docs were checked for type-safe routes, search params, route context, and nested route typing.
  - https://tanstack.com/router/latest/docs/guide/type-safety
  - https://tanstack.com/router/latest/docs/guide/search-params
- TanStack Query: official docs were checked for server state cache, query lifecycle, mutations, invalidation, and retry/refetch boundaries.
  - https://tanstack.com/query/latest/docs/framework/react/overview
  - https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- Zod: official docs were checked for TypeScript-first runtime schema validation, parsing, and safe validation workflows.
  - https://zod.dev/
- Logseq: public project/docs material was checked for local-first notes, Markdown / org-mode storage, graph thinking, user control, and long-lived knowledge workflows.
  - https://docs.logseq.com/
  - https://github.com/logseq/logseq
- SteelCompendium / structured TTRPG data: a stable canonical public source for the exact name `SteelCompendium` was not located during this pass. The project still adopts the task-specified principle: TTRPG rules and compendium content should be structured, machine-readable, human-editable, and separated from UI/runtime code.

## 3. What We Learn

### Foundry VTT / foundryvtt-dnd5e

Foundry's useful lesson is not its UI, but its object separation:

- platform core knows generic entities such as Actor, Item, Scene, Journal, Compendium, and Document;
- game systems provide system-specific models and sheets;
- compendium content is not the same as world-owned content;
- actor-owned embedded items are not the same as catalog definitions.

Project rule:

- platform code may know `Actor`, `Campaign`, `Runtime`, `Package`, `Document`, and `Asset`;
- DND / COC / CP RED rule fields must stay in system adapters;
- equipment, spells, feats, classes, occupations, skills, cyberware, NPC templates, and map assets start as Catalog / Compendium objects;
- character sheets show owned/equipped/current state, not full catalog content.

### tldraw

tldraw's useful lesson is document-as-record-graph:

- canvas data is a set of typed records;
- shapes, bindings, assets, pages, validation, migrations, and history are distinct concepts;
- changes should be batched and replayable;
- multiplayer canvas work needs consistent client/server schema thinking.

Project rule:

- a map is not a picture;
- future map work must model `MapDocument`, `SceneDocument`, `TokenDocument`, `DrawingDocument`, `FogState`, and `MediaAssetRef`;
- token / fog / drawing state must not be scattered through ordinary React component state;
- canvas records need schema validation, migration strategy, undo/redo scope, and projection boundaries.

### Yjs / CRDT

Yjs shows where CRDTs are strong:

- shared maps, arrays, and text are appropriate for collaborative documents;
- CRDTs are good for conflict-free merging, but not every gameplay state should be a CRDT.

Project rule:

- do not synchronize the entire store through WebSocket or CRDT;
- map annotations, whiteboard drawings, collaborative notes, and shared text are future CRDT candidates;
- RuntimeLog should be an append-only event stream;
- HP, resources, inventory, equipment, permissions, and campaign entry authority should become server-authoritative later;
- CRDT state must be scoped, not global.

### TanStack Router

TanStack Router's useful lesson is typed navigation context:

- route params, search params, and route context are typed;
- nested layouts carry context;
- validated search state prevents stringly-typed mode drift.

Project rule:

- `ActorVaultPurpose`, `CampaignLibraryPurpose`, `returnTo`, `suggestedActor`, and future library purposes must be explicit types;
- do not infer page mode from loosely-coupled optional props;
- future URL/search state must be schema-validated and typed before use;
- page hierarchy must remain Catalog / Workspace / Module / Library / Detail / Add Flow, not flattened.

### TanStack Query

TanStack Query's useful lesson is server state separation:

- remote data has cache lifecycle, stale/fresh state, retry, refetch, invalidation, and mutation workflows;
- server state should not be hidden inside local component state.

Project rule:

- UI state, flow state, runtime local context, server state, persistent domain state, and collaborative state must stay distinct;
- future backend integration should go through repository/service boundaries and a query layer;
- remote Actor, Campaign, Package, MediaAsset, and BlockDocument records must not be treated as ephemeral React state;
- mutations require preview/intent, server write, invalidation, and projection update.

### Zod / runtime schema validation

Zod's useful lesson is that TypeScript interfaces do not validate user input:

- untrusted data must be parsed at runtime;
- validation should return typed results or clear warnings/errors.

Project rule:

- every external import must run through schema validation;
- `WorkshopPackageManifest`, actor import, campaign import, `BlockDocument` import, `MediaAsset` references, map documents, and handout packages need validation;
- import workflow is:
  - raw input;
  - schema parse;
  - import preview;
  - validation warnings;
  - user confirmation;
  - repository write.

### Logseq

Logseq's useful lesson is local-first longevity:

- notes and knowledge graphs should remain user-controlled;
- Markdown-like content, block structure, backlinks, PDF annotations, tasks, and notes are long-lived assets;
- documents should not be locked into a private UI-only format.

Project rule:

- `BlockDocument`, handout, scene note, NPC note, clue, and campaign journal records must remain durable, exportable, and reusable;
- document relationships should be visible through EntityGraph-style links;
- document storage must preserve user control and long-term portability;
- UI rendering is a projection of document data, not the document's only representation.

### SteelCompendium / structured TTRPG data

The exact named source could not be verified as a stable canonical public project in this pass, but the architecture direction is accepted:

- TTRPG rules should be structured data, not UI code;
- Markdown / JSON / YAML-style interchange is useful;
- rules extraction belongs in package/catalog layers;
- local compendium management must be separated from runtime ownership.

Project rule:

- source extraction results become structured data/package records;
- content packages must be machine-readable and reasonably human-editable;
- rules and lore content must not be hardcoded into page components;
- catalog data must be imported into owned/campaign/runtime layers through explicit workflows.

## 4. What We Will Not Copy

We will not copy:

- Foundry's exact data model, module API, sheet framework, compendium implementation, or permission model;
- tldraw's implementation details, store package, or multiplayer sync layer;
- Yjs as a blanket synchronization layer for all runtime state;
- TanStack Router or TanStack Query until routing/backend boundaries require them;
- Zod or any schema library without an explicit dependency decision;
- Logseq's UI, outliner, database model, or plugin system;
- any third-party rules data, UI source, or copyrighted content.

We will copy the architecture discipline:

- separate platform objects from system adapters;
- separate catalog definitions from owned instances;
- separate suggested flow context from selected runtime context;
- validate imports before writes;
- keep runtime shell, runtime log, map canvas, and documents as distinct layers.

## 5. Project-Specific Rules

### A. Object Layering

Use these object layers:

- `CatalogObject`: reference/library object from source data or packages.
- `OwnedObject`: user-owned object in an Actor Vault or user library.
- `CampaignObject`: object attached to a concrete campaign instance.
- `RuntimeObject`: live object inside a running session.
- `LogEvent`: append-only event describing runtime actions or system events.
- `Projection`: what a viewer can see; not necessarily the source object or permission authority.

Required distinctions:

- Catalog Item is not Owned Item.
- Actor Template is not Campaign Actor Instance.
- Campaign Actor Instance is not Runtime Actor State.
- Document Template is not Published Handout.
- Map Asset is not Runtime Scene.
- Compendium spell/equipment/feat/class definition is not a character's prepared/owned/equipped/current state.
- WorkshopPackage is not Campaign.
- Campaign is the actual play room/space instance, even when created from a package.

Coding constraints:

- platform layer owns generic types and purpose/context contracts;
- system adapters map DND / COC / CP RED data into platform summaries/projections;
- a UI card must say whether it is showing catalog, owned, campaign, runtime, or projection state;
- do not let catalog records masquerade as player-owned objects.

### B. State Layering

Use these state layers:

- `UI State`: open panels, selected tabs, filters, sort order, local expanded/collapsed state.
  - Location: local React state or local UI controller.
  - Persistence: no, unless explicitly user preference.
- `Flow State`: purpose, returnTo, suggestedActor, add/select context, creation completion context.
  - Location: typed platform flow context, usually local workspace state until routing exists.
  - Persistence: no, unless the flow is resumed intentionally.
- `Runtime Local Context`: current runtime shell entry role, local selected actor display, shell-only campaign runtime context.
  - Location: runtime shell state/context.
  - Persistence: no in current frontend-only phase.
- `Server State`: remote Actor, Campaign, Package, MediaAsset, BlockDocument, user, room, membership, permission data.
  - Location: future repository/query layer.
  - Persistence: server/database.
- `Persistent Domain State`: local or remote saved domain records that survive reload/import/export.
  - Location: store/repository with migrations and schemas.
  - Persistence: yes.
- `Collaborative State`: shared canvas/text/annotation state that multiple clients edit concurrently.
  - Location: future scoped collaboration document, not global app store.
  - Persistence: via collaboration backend/snapshot strategy.

Forbidden mixing:

- do not store flow suggestions as persistent selected values;
- do not store runtime local context in domain store until an explicit commit action exists;
- do not put remote server records directly into component state as if they were local UI state;
- do not use collaborative state for authoritative HP/resources/equipment until authority rules are designed.

### C. Flow Context Typing

Rules:

- new page modes should prefer a `Purpose` discriminated union;
- do not add multiple loosely-coupled booleans such as `isSelecting`, `fromCampaign`, `showAdd`, `returnToCampaign`;
- do not infer mode from nullable optional props when a purpose enum/union is clearer;
- context values should explicitly distinguish `suggested` from `selected`.

Current and future examples:

- `ActorVaultPurpose`
- `CampaignLibraryPurpose`
- `DocumentLibraryPurpose`
- `MediaLibraryPurpose`
- `MapLibraryPurpose`
- `HandoutLibraryPurpose`
- `PackageLibraryPurpose`

Pattern:

```ts
type SomeLibraryPurpose =
  | { kind: 'manage' }
  | { kind: 'selectForCampaign'; context: SelectContext }
  | { kind: 'addForCampaign'; context: AddContext };
```

### D. Import Validation

Rules:

- all external input must pass runtime schema validation;
- TypeScript interfaces are not enough for imported JSON, Markdown, package manifests, media refs, campaign exports, or actor files;
- every import must show a preview before commit;
- validation warnings should be visible to users;
- import writes must go through repository/service boundaries.

Required import pipeline:

1. raw input
2. schema parse
3. import preview
4. validation warnings
5. user confirmation
6. repository write

Validation targets:

- `WorkshopPackageManifest`
- Actor imports
- Campaign imports
- `BlockDocument` imports
- `MediaAsset` references
- `MapDocument` / `SceneDocument`
- Handout packages
- rules data extraction packages

### E. Runtime / Multiplayer Strategy

Rules:

- `RuntimeLog` is append-only event log.
- Map annotations are future CRDT candidates.
- Shared document/whiteboard text is a future CRDT candidate.
- HP / resources are future server-authoritative candidates.
- Equipped state and inventory mutations are future server-authoritative candidates.
- Handout publish is event + visibility projection.
- Chat is a message stream.
- Visibility is a projection, not proof of permission enforcement.

Current shell policy:

- Campaign Runtime Shell can display placeholders/projections;
- it must not imply multiplayer, permissions, persistence, map sync, or real log writes until those systems exist.

### F. Character Sheet Separation

Separate:

- `Character Builder`: creates/edits actor data.
- `Character Sheet`: displays current actor state and common player-facing summaries.
- `Character Audit`: validates completeness, warnings, source conflicts, and data quality.
- `Compendium / Catalog`: stores rules/reference definitions.

Rules:

- do not put full equipment/spell/feat/class catalogs on the default character sheet;
- character sheet shows current actor-owned, equipped, prepared, usable, or consumable state;
- builder choices consume source settings/catalogs but do not become catalog browsers;
- audit surfaces missing/needs-human-check data without changing runtime behavior.

### G. Map / Canvas Future Rule

Rules:

- future map work uses `MapDocument`, `SceneDocument`, `TokenDocument`, `DrawingDocument`, and `FogState`;
- map background image is only one asset reference inside a scene/map document;
- do not build map as a single image plus temporary token coordinates;
- token state, fog state, drawing state, measurements, notes, and assets need typed records;
- map document schema must support migration, validation, undo/redo scope, and future collaboration strategy.

## 6. Current Applicable Rules

Apply immediately to current frontend work:

- Use explicit purpose/context unions for Actor Vault and Campaign Library flows.
- Keep `suggestedActor` as UI recommendation until an explicit entry action creates a local runtime context.
- Keep `selectedActorId` and `selectedEntryRole` out of persistent store until a real commit exists.
- Keep `CampaignRuntimeShell` as UI shell/projection until runtime backend exists.
- Keep DND / COC / CP RED rule data out of platform shells.
- Do not add direct runtime entry from actor cards; campaign launch goes through campaign detail / entry preparation.
- Do not flatten System Library, System Landing, Module Home, Object Library, Detail, and Add Flow into one page.
- Do not add catalog lists to character sheet default views.
- Do not use visible UI to imply real permissions, multiplayer, or persistence when only placeholders exist.

## 7. Future Applicable Rules

Apply when the relevant systems are introduced:

- Backend/repository work must define server state, mutation lifecycle, invalidation, and optimistic/pessimistic update policy.
- Import/export work must introduce runtime schemas and preview/confirm flows.
- Package library work must distinguish package manifest, package library entry, installed/enabled state, and campaign-created-from-package.
- Map work must start from document records and schema, not image rendering.
- Runtime log work must define append-only event type, visibility, persistence, replay, and export.
- Multiplayer work must decide which state is CRDT, which is server-authoritative, and which is local-only.
- AI Host work must consume projections and event streams; it must not bypass permission, validation, or repository boundaries.

## 8. Anti-patterns

Do not:

- put DND-specific fields into platform object types;
- use `any` or loose optional props to dodge flow modeling;
- treat CatalogObject as OwnedObject;
- treat WorkshopPackage as Campaign;
- treat suggestedActor as selectedActorId;
- persist runtime shell context as campaign membership;
- use WebSocket to sync the whole store;
- put hidden GM state in a player projection;
- make map state a collection of random component state variables;
- import JSON directly into store without schema parse and preview;
- hardcode rules text into UI components;
- make character sheet a compendium browser;
- expose placeholder actions as if they are complete features.

## 9. Checklist for Coding AI

Before writing code, answer:

- Is this catalog / owned / campaign / runtime / log / projection layer?
- Is this UI / flow / runtime / server / persistent / collaborative state?
- Is this value suggested or selected?
- Is this projection or real permission?
- Is this placeholder or real function?
- Does this need schema validation?
- Should this introduce or extend a purpose enum/union?
- Will this leak DND / COC / CP RED rule details into platform code?
- Will this put catalog data into the character sheet?
- Will this persist runtime state too early?
- Does this import external data?
- Does this require repository/service boundary instead of component-local logic?
- Does this need a preview/confirm workflow?
- Does this flatten Catalog / Workspace / Module / Library / Detail / Add Flow?
- Does this imply multiplayer/backend/persistence that does not exist yet?

Completion report for future coding tasks must state:

- which existing component/pattern was reused;
- whether any parallel entry was added;
- whether any hierarchy was flattened;
- whether Navigation & Exit Contract was preserved;
- whether real writes were introduced;
- `tsc` / build result;
- exact `git add` command.
