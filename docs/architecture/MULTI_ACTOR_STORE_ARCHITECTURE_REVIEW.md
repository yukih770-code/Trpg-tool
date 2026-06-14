# Multi-Actor Store Architecture Review

<!-- AI-LANDMARK: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1 -->

Last updated: 2026-06-14
Phase: P1 platform IA
Status: Architecture review only — no `src/` implementation in this round.

## Purpose

This document answers the design questions that must be resolved before the platform can implement a true multi-actor vault for DND 5e 2024, COC 7e, and Cyberpunk RED. It defines the vocabulary, data model candidates, migration strategy, and UI impact. It does **not** implement any of this — all implementation is deferred to a later isolated round.

Related architecture documents:
- `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` §2.2: Actor / Player Asset Entry Pattern — "True multi-actor store is a P2+ schema task."
- `UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md` §3: Actor Vault page responsibility contract.
- `PLATFORM_CORE_CONCEPTS.md` §2: Actor / Player Asset platform vocabulary.

---

## 1. Actor Unified Concept

### Platform-level name: Actor

The platform abstraction for any playable or manageable entity is **Actor** (also described as **Player Asset** in `PLATFORM_CORE_CONCEPTS.md`).

| System | System display name | Platform abstraction |
|---|---|---|
| DND 5e 2024 | Character / 角色 | Actor |
| COC 7e | Investigator / 调查员 | Actor |
| Cyberpunk RED | Edgerunner | Actor |
| Future: wargame | Unit / Vehicle | Actor |
| Future: narrative | Character / NPC | Actor |
| Future: Companion | Companion | Actor |

### Naming rules

- **Platform layer** uses `actor` / `Actor` in all code identifiers: `actorInstanceId`, `ActorMeta`, `ActorRegistry`.
- **System layer** may use system-specific terms in rule logic and display labels: `jobClass`, `occupation`, `role`.
- **Actor Vault UI** uses the generic platform label "角色库 / Actor Vault" in top navigation. System-specific names ("调查员库", "Edgerunner 库") appear only in page titles and card headings.
- Future systems (Unit / NPC / Companion) declare their own `primaryActorType` in the Game System Registry; the platform renders the correct label without changing the Actor data model core.

### Actor kinds (for future extensibility)

```ts
type ActorKind =
  | 'playerCharacter'   // DND Character, COC Investigator, CP RED Edgerunner
  | 'unit'              // Wargame unit
  | 'vehicle'           // Wargame vehicle
  | 'npc'               // Non-player character managed by GM
  | 'companion'         // Companion / familiar / sidekick
  | 'custom';           // User-defined
```

V1 multi-actor implementation only needs `'playerCharacter'`. Defining the type now avoids a breaking rename later.

---

## 2. Actor Instance ID

### Requirements

- Every actor must have a **stable, globally unique identifier** that persists through saves, exports, reimports, and copies.
- The ID must **not** be derived from the actor's name (names change).
- The ID must **not** be the array index (indices change when actors are added/removed/reordered).
- Imported actors from external sources must receive a stable ID at import time.
- Copying an actor must generate a **new** ID for the copy; the source ID is preserved on the source.
- Existing single-actor saves without an ID must receive a generated ID during migration.

### Proposed design

```ts
type ActorInstanceId = string; // e.g. "actor-1718352000000-a3f7b2k"

function makeActorInstanceId(): ActorInstanceId {
  const rand = Math.random().toString(36).slice(2, 9);
  return `actor-${Date.now()}-${rand}`;
}
```

### System linkage

```ts
type SystemId = 'dnd5e2024' | 'coc7e' | 'cpred';
// future: 'jakairblade' | 'warhammer40k' | 'custom-xxx'
```

The combination `(actorInstanceId, systemId)` uniquely identifies an actor across all systems in the platform. The platform never reuses an `actorInstanceId` across systems.

### ID stability rules

| Event | ID behavior |
|---|---|
| Actor is created | New `actorInstanceId` generated |
| Actor is edited | Same `actorInstanceId` retained |
| Actor is renamed | Same `actorInstanceId` retained |
| Actor is exported | `actorInstanceId` included in export envelope |
| Actor is imported | `actorInstanceId` from envelope used if present; else new ID generated |
| Actor is copied | New `actorInstanceId` for copy; original unchanged |
| Actor is deleted | `actorInstanceId` retired (no reuse) |
| Legacy save without ID | ID generated lazily during migration |

### Where the ID currently lives

`CharacterData.id`, `CocCharacter.id`, and `CpCharacter.id` already exist as `string` fields in the current schemas, but they are currently `''` (empty string) in practice — they are never populated by the current single-actor workflow. The migration step must populate these from the existing field (if non-empty) or generate a new ID (if empty).

---

## 3. Actor Metadata

### Problem

The Actor Vault card must display a lightweight summary for each actor. Different systems have different meaningful summary fields — forcing a single flat schema onto all systems creates either over-fitting (DND-specific fields on a COC actor) or under-specification (COC fields that don't exist in DND).

### Proposed design: common meta + systemSummary

```ts
type ActorMeta = {
  // ── Universal fields (all systems) ──────────────────────────────────
  actorInstanceId: ActorInstanceId;
  systemId: SystemId;
  actorKind: ActorKind;                 // default: 'playerCharacter'
  displayName: string;                  // primary vault card heading
  updatedAt: string;                    // ISO 8601 — for "最近" ordering

  // ── Source / creator (all systems; all optional) ─────────────────────
  sourceType: ActorSourceType;          // see §4
  creatorName?: string;                 // display name of creator
  creatorUid?: string;                  // platform user ID (future)
  importedBy?: string;                  // display name of importer

  // ── Campaign binding (all systems; optional) ─────────────────────────
  campaignStatus: CampaignStatus;       // see §5
  campaignId?: string;                  // future: campaign reference ID
  campaignName?: string;                // denormalized display name

  // ── System-specific summary (system declares; platform renders) ───────
  systemSummary: SystemActorSummary;    // discriminated union — see below
};
```

### System-specific summary (discriminated union)

```ts
type SystemActorSummary =
  | DndActorSummary
  | CocActorSummary
  | CpRedActorSummary;

type DndActorSummary = {
  system: 'dnd5e2024';
  level: number;
  jobClass: string;         // e.g. "战士"
  subclass?: string;        // e.g. "战斗大师"
  species: string;          // e.g. "人类"
  background: string;       // e.g. "士兵"
};

type CocActorSummary = {
  system: 'coc7e';
  occupation: string;       // e.g. "私家侦探"
  age: number;
  residence: string;        // e.g. "波士顿"
};

type CpRedActorSummary = {
  system: 'cpred';
  handle: string;           // Edgerunner street name
  role: string;             // e.g. "Solo"
  roleLevel: number;
};
```

### Notes

- `ActorMeta` is always a **derived, cached subset** of the full actor data — it is never the source of truth for rule-relevant fields.
- On actor save, `ActorMeta` is updated from the full data object.
- `displayName` is the only required display field; all `systemSummary` fields are best-effort from existing data.
- `updatedAt` drives "最近角色 / Recent Character" ordering.

---

## 4. Source and Creator

### Source type

```ts
type ActorSourceType =
  | 'platform-created'    // Created on this platform
  | 'local-import'        // Imported from a local JSON file
  | 'workshop-import'     // Imported from Workshop (future)
  | 'copied'              // Copied from another actor on this platform
  | 'preset'              // A built-in example / starter actor
  | 'unknown';            // Legacy actors without source information
```

### Creator fields

```ts
type ActorCreator = {
  creatorName?: string;   // Human-readable display name (set at creation time)
  creatorUid?: string;    // Platform user ID (future; undefined until user accounts exist)
  importedBy?: string;    // Human-readable display name of the user who imported this actor
};
```

### Rules

- These fields are **UI metadata only**. They do not affect rule logic, dice, or runtime behavior.
- `creatorUid` is reserved for future user account integration; it is **not** implemented in V1 multi-actor.
- Legacy actors migrated from single-actor saves get `sourceType: 'platform-created'` and `creatorName: undefined`.
- An imported actor's `sourceType` is `'local-import'`. The `importedBy` field may be set to the current local user's name if available.
- Copying an actor sets `sourceType: 'copied'` on the copy; the original's `sourceType` is preserved.

---

## 5. Campaign Binding

### Campaign status values

```ts
type CampaignStatus =
  | 'none'              // Actor is not bound to any campaign
  | 'bound'             // Actor is bound to a specific campaign
  | 'created-for'       // Actor was created specifically for a campaign
  | 'copied-from';      // Actor was copied from a campaign context
```

### Binding rules

- An actor can exist in the Actor Vault **independently** of any Campaign. `campaignStatus: 'none'` is the default.
- An actor can be **bound** to a Campaign. The vault shows campaign-bound actors alongside unbound ones; filtering / grouping is a future V2 feature.
- A Campaign can **reference** an actor, but the actor does not require the Campaign to exist. The vault is not a child of the Campaign.
- When a Campaign is deleted, its bound actors are **not** deleted. They return to `campaignStatus: 'none'`.
- `campaignId` and `campaignName` are denormalized: `campaignName` is stored on the actor at binding time so that the vault card can display the campaign name without fetching campaign data.

### What this round does NOT implement

- No `Campaign` store, Campaign schema, or Campaign persistence.
- No campaign binding UI or linking flow.
- No multi-Campaign actor enrollment.
- `campaignId` and `campaignName` are reserved fields only — they remain `undefined` until Campaign architecture is implemented.

---

## 6. Data Model Candidates

### Option A: Per-system independent arrays

```ts
// Three separate Zustand stores (current pattern extended)
// characterStore.ts
dndCharacters: CharacterData[];        // indexed by actorInstanceId

// cocStore.ts
cocInvestigators: CocCharacter[];      // indexed by actorInstanceId

// cpStore.ts
cpredCharacters: CpCharacter[];        // indexed by actorInstanceId
```

Each store also holds:
```ts
activeActorId: ActorInstanceId | null; // "most recently used" pointer
```

#### Option A — Advantages

- **Lowest migration risk.** Each existing store needs only one new field (`[]` array + `activeActorId`). The migration is additive.
- **Type safety per system.** `CharacterData` / `CocCharacter` / `CpCharacter` types remain unchanged; no generic wrapper needed.
- **Build / tsc risk is minimal.** Existing code that reads `useCharacterStore(state => state.character)` can be shimmed during transition.
- **Incremental adoption.** The DND vault can go multi-actor first without COC/CP following simultaneously.
- **No cross-store actor query.** The Actor Vault per system only reads its own store.

#### Option A — Disadvantages

- **Cross-system Actor Vault is not possible.** A unified "all actors" view (e.g. for a multi-system campaign) requires reading all three stores and merging.
- **`ActorMeta` must be duplicated** across each system's item in the per-system array.
- **ID namespace is per-store.** Risk of collision if stores are merged later.
- **Search and filter** across systems requires aggregating all three stores.
- **Export envelope stays per-system** — no single unified actor export format.

#### Option A — Migration risk

| Risk | Level | Notes |
|---|---|---|
| Save format change | Medium | Array replaces single object in localStorage. Backward-compat shim required. |
| `activeActorId` pointer | Low | New field, additive. |
| Existing UI read (`state.character`) | Medium | All read sites must switch to `selectActiveActor(state)` helper. Many call sites. |
| Import/export compatibility | Medium | Export format can stay identical; vault list is new wrapper. |

---

### Option B: Platform unified Actor Registry

```ts
// Single unified store (new: actorRegistryStore.ts or added to appStore.ts)
type ActorRegistry = {
  actors: ActorRegistryEntry[];
  activeActorId: ActorInstanceId | null; // per-system or global?
};

type ActorRegistryEntry = {
  actorInstanceId: ActorInstanceId;
  systemId: SystemId;
  meta: ActorMeta;           // lightweight display data (see §3)
  data: SystemActorData;     // the full character data (discriminated union)
};

type SystemActorData =
  | { system: 'dnd5e2024'; character: CharacterData }
  | { system: 'coc7e'; character: CocCharacter }
  | { system: 'cpred'; character: CpCharacter };
```

#### Option B — Advantages

- **True platform-level Actor Vault.** A unified "all actors across all systems" query is trivial.
- **Single source of truth for `actorInstanceId`** across all systems — no collision risk.
- **Unified export envelope.** A single `actors[]` export could contain actors from all three systems.
- **Campaign binding is stored once** in `ActorMeta`; no per-system duplication.
- **Future extensibility.** Adding a fourth Game System only requires a new `SystemActorData` union member.
- **Consistent `updatedAt` ordering** across all actors on all systems.

#### Option B — Disadvantages

- **Largest migration risk.** All three stores must be restructured simultaneously.
- **All existing call sites break.** `useCharacterStore(state => state.character)` becomes `selectActiveDndActor(state)` or similar. This is a large codebase refactor.
- **Type narrowing complexity.** Every accessor that touches character data must first narrow `SystemActorData` by `system`. This adds runtime and compile-time complexity throughout the codebase.
- **localStorage migration.** Three separate localStorage keys (`trpg-dnd-*`, `trpg-coc-*`, `trpg-cp-*`) become one (`trpg-actor-registry`). The migration must read the old keys, extract their single actor, wrap in `ActorRegistryEntry`, and write the new unified key. If this migration fails, data is lost.
- **All three systems must migrate simultaneously.** Cannot be done incrementally per system.
- **`persist` middleware complexity.** A single large store with deeply nested per-system data is harder to version and partition than three smaller focused stores.

#### Option B — Migration risk

| Risk | Level | Notes |
|---|---|---|
| Save format change | **High** | Three separate localStorage keys → one. All existing saves require a migration pass. |
| Data loss on migration failure | **High** | If the unified migration fails mid-read, all existing actors are at risk. |
| All read/write call sites | **High** | Every `useCharacterStore`, `useCocStore`, `useCpStore` call site must be refactored. |
| Type narrowing burden | Medium | Every accessor needs a system discriminant check. |
| Import/export format change | Medium | New unified format must maintain backward-compat with existing per-system export envelopes. |
| tsc complexity | Medium | Generic discriminated union + system-specific narrowing adds compile-time surface area. |

---

### Recommendation: Option A first, with Option B as a follow-on

**Recommended path: Option A for V1 multi-actor implementation.**

Rationale:
1. **Risk budget.** True multi-actor store is already designated as a P2+ high-risk schema task in `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` §12. Option A is the lower-risk path to unlock the multi-actor UI with minimal migration surface.
2. **Incremental delivery.** Option A lets DND multi-actor ship before COC and CP RED; Option B requires all three simultaneously.
3. **Cross-system queries are not required in V1.** The Actor Vault per system only shows actors for that system. A unified cross-system actor query is a V2 feature.
4. **Option B can be adopted later.** Once each per-system array is stable and all UI call sites use an abstracted `selectActiveActor()` helper (rather than `state.character` directly), migrating from Option A to Option B is a well-defined refactor at a later stage.

**Condition for switching to Option B:** when the platform needs to display actors from all systems in a single unified vault (e.g. a "party" view with DND + COC + CP RED actors), Option B becomes necessary. That feature is outside current scope.

---

## 7. Migration Strategy

### Current state

Each of the three Zustand stores with `persist` middleware stores a **single character object** in localStorage:
- `useCharacterStore` → localStorage key `trpg-dnd-*` or similar (check `characterStore.ts`)
- `useCocStore` → localStorage key `trpg-coc-*` or similar
- `useCpStore` → localStorage key `trpg-cp-*` or similar

Each object has:
- `schemaVersion: number` (already present)
- `id: string` (exists but is `''` in practice for most existing saves)

### Migration steps for Option A

#### Step 1 — Ensure `actorInstanceId`

The existing `id` field on each character type becomes the `actorInstanceId`. The migration checks:

```ts
function ensureActorInstanceId(char: { id: string }): string {
  if (char.id && char.id.trim().length > 0) return char.id;
  return makeActorInstanceId();
}
```

This is a **lazy migration** — it runs when the store first loads, not as a destructive one-time script. If `id` is already populated, it is kept; if empty, a new ID is generated and written.

#### Step 2 — Wrap single character in an array

```ts
// Old state shape (current)
{ character: CharacterData }

// New state shape (multi-actor)
{ characters: CharacterData[];  activeCharacterId: string | null; }
```

Migration on store hydration:
```ts
// In Zustand persist migrate() callback
if (persisted.character && !persisted.characters) {
  const char = persisted.character;
  const id = ensureActorInstanceId(char);
  return {
    characters: [{ ...char, id }],
    activeCharacterId: id,
  };
}
```

#### Step 3 — UI default: most recently used

`activeCharacterId` points to the most recently used actor. The vault Existing Actors section shows this actor first (labeled "最近角色 / Recent Character"). If `activeCharacterId` is null or refers to a deleted actor, the vault shows the empty state.

#### Step 4 — `updatedAt` on actor objects

The new schema adds an optional `updatedAt: string` to each character. If not present on migrated legacy actors, default to `new Date().toISOString()` at migration time.

### Invariants

- **Old saves are never deleted.** The migration is additive: the single character object becomes `characters[0]`.
- **No complex one-time migration scripts.** Migration runs lazily in the Zustand `migrate` callback, which already exists for `schemaVersion` bumps.
- **The `schemaVersion` bump signals the migration.** When `schemaVersion` increments (e.g., from 2 to 3 for DND), the existing `migrateCharacter()` function in `characterMigration.ts` gains a new case that wraps the single object in the array.
- **The `persist` key stays per-system.** No cross-store merging at migration time.

### COC-specific note

`CocCharacter` already has a `runtime` field (`CocRuntimeState`) with nested state. The array migration must preserve this nested structure unchanged.

### CP RED-specific note

`CpCharacter` already uses stable `instanceId` on inventory items (added in `CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1`). This pattern should be the blueprint for the actor-level `actorInstanceId`.

---

## 8. UI Impact

### Current state (single-actor)

The current Actor Vault (after `ACTOR_VAULT_EXISTING_ADD_SPLIT_V1`) has two sections:
1. **Existing Actors** — shows the single current actor (or empty state)
2. **Add Actor** — Standard Create + planned entries

### Future multi-actor vault (Option A)

The same two-section structure accommodates multiple actors:

```
角色库 / Actor Vault
├── 已有角色 / Existing Actors
│   ├── [Most recent actor card] — primary CTA: View Sheet
│   ├── [Actor card 2]
│   ├── [Actor card 3]
│   └── [... up to N actor cards]
└── 添加角色 / Add Actor
    ├── Standard Create → Builder (active)
    ├── Quick Create (planned)
    ├── Local Import (planned)
    └── Workshop Import (planned)
```

### Rules for multi-actor vault UI

- Do **not** flatten the two-section layout when multiple actors exist. The "Existing / Add" split remains.
- Do **not** merge the actor list and the add-actor section into one visual area.
- The most-recently-used actor appears first in the Existing Actors list (driven by `updatedAt` or `activeCharacterId`).
- Each actor card shows: `displayName`, `systemSummary` fields (level/class/occupation/role etc.), source, campaign.
- Each actor card's primary CTA is "进入 / Enter" (→ View Sheet).
- Secondary actions on each actor card (future): Duplicate, Delete, Export.
- `singleActorLimitNote` caption in the Add Actor section is removed once multi-actor is implemented.
- When the actor list is long, Existing Actors section gains a search / filter bar (V2 feature — not V1 multi-actor).

### Actor Vault page responsibility remains unchanged

From `UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md` §3:
- **Responsible for:** Actor list, current Actor context, create/open CTAs.
- **Not responsible for:** Building, runtime, rule lookup, data coverage.

Multi-actor does not change this responsibility; it only increases the count of items in the Existing Actors section.

### Sheet / Builder navigation

No change. Clicking "进入" on any actor card in the vault:
1. Sets `activeCharacterId` to that actor's `actorInstanceId`.
2. Opens the Sheet for that system with the selected actor's data.
3. Back / Up navigation behavior: Sheet → Vault (unchanged).

---

## 9. Risk Boundaries

The following risks apply when the true multi-actor implementation task is eventually scoped and executed. Each is listed with its category and recommended handling.

### 9.1 Save format migration

**Risk level: High**

The Zustand `persist` store shape changes from `{ character: T }` to `{ characters: T[]; activeCharacterId: string | null }`. The `migrate` callback must correctly handle all existing localStorage data, including saves from users who have never updated since the initial version.

**Mitigation:** Test migration with real save data before shipping. Version the `persist` store with a `version` bump separate from `schemaVersion`.

### 9.2 localStorage compatibility

**Risk level: High**

If `persist` is configured with `partialize` or custom serializers, the migration path must account for these. The existing `characterStore.ts` uses standard Zustand persist; confirm no custom serialization before migration.

**Mitigation:** Read `persist` options in all three stores before beginning implementation. Do not assume they are identical.

### 9.3 Import/export compatibility

**Risk level: Medium**

The existing `TrpgCharacterExportEnvelope` exports a single character. Post-migration, the envelope can still export a single actor (backward-compat); a new "export all actors" format is an additive feature.

The existing legacy sniffer (`sniffLegacyCharacterSystem` in `export-envelope.ts`) relies on unique top-level fields: `attrs` (DND), `characteristics` (COC), `stats` (CP RED). This continues to work post-migration since the per-character object shape does not change.

**Mitigation:** No changes to `export-envelope.ts` needed for V1 multi-actor.

### 9.4 Actor switching (current actor pointer)

**Risk level: Medium**

All read sites currently assume a single character (`useCharacterStore(state => state.character)`). Post-migration, they must read the **active** actor (`useCharacterStore(state => state.activeCharacter())`). This is the largest code-change surface — approximately every component that reads actor data.

**Mitigation:** Add a `selectActiveCharacter()` selector to each store early. Migrate all read sites to use the selector before introducing the array. This decouples selector introduction from array introduction.

### 9.5 Campaign binding

**Risk level: Low (deferred)**

`campaignId` and `campaignName` are reserved fields in `ActorMeta`. No Campaign store, binding UI, or linking flow is implemented in V1 multi-actor. Campaign architecture is a separate P2+ task.

### 9.6 Runtime actor reference

**Risk level: High**

The DND, COC, and CP RED runtime panels (Gameplay, CocGameplay, CpGameplay) all implicitly operate on the single current character in their respective stores. When multi-actor is live and a user switches the active actor mid-session, the runtime must correctly reflect the new actor's state without clearing unrelated state.

**Mitigation:** V1 multi-actor should **not** enable actor switching from within the runtime. Switching is only available from the Actor Vault (outside of play mode). This gates the runtime reference risk.

### 9.7 Inventory / equipment ownership

**Risk level: Medium**

CP RED already has per-item `instanceId` (from `CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1`). DND `inventory` is currently a `string[]` (no per-item ID). COC `inventory` is also unstructured. Multi-actor must ensure that inventory data stays associated with the correct actor after a switch.

**Mitigation:** Since each actor's full data (including inventory) is stored in `characters[i]`, inventory is inherently scoped to its actor. No cross-actor inventory sharing in V1.

### 9.8 Spell / resource state ownership

**Risk level: Medium**

DND `classResources: ResourceState[]` and `spellbook.slots` are actor-scoped. COC `runtime` (HP, SAN, Luck) is actor-scoped. CP RED `runtime` (HP, Humanity) is actor-scoped. Post-migration, each actor in the `characters[]` array carries its own runtime state. No risk of cross-actor state bleed if all existing runtime logic reads from `characters.find(c => c.id === activeCharacterId)`.

**Mitigation:** No changes to runtime state shape required in V1 multi-actor.

### 9.9 Undo / trash / history

**Risk level: Low (deferred)**

Delete actor, undo delete, and actor history are not planned for V1 multi-actor. Soft-delete (move to trash) is a V2 feature. For V1, delete is permanent; the vault shows a confirmation dialog before removal.

### 9.10 Multi-actor count limit

**Risk level: Low (product decision)**

The product currently enforces single-actor mode. For V1 multi-actor, a maximum actor count per system should be defined (e.g. 20 actors per system) to avoid unbounded localStorage growth. This is a product policy, not an architectural constraint, but it must be decided before implementation.

---

## Summary Table

| Topic | Recommendation |
|---|---|
| Platform name | Actor |
| System names | Character / Investigator / Edgerunner (system layer) |
| ID field | `actorInstanceId: string` (generated, stable, per-actor) |
| System field | `systemId: 'dnd5e2024' \| 'coc7e' \| 'cpred'` |
| Metadata shape | `ActorMeta` (universal) + `SystemActorSummary` (discriminated union per system) |
| Source type | `ActorSourceType` (5 values: platform-created / local-import / workshop-import / copied / preset) |
| Creator fields | `creatorName` / `creatorUid` (reserved) / `importedBy` |
| Campaign binding | `campaignStatus` + `campaignId` (reserved) + `campaignName` (reserved) |
| Data model | **Option A** (per-system arrays) recommended for V1 |
| Migration | Additive: single object → `characters[0]`; `id` becomes `actorInstanceId`; lazy in `migrate` callback |
| UI layout | Two-section vault (Existing / Add) unchanged; Existing section becomes a list |
| Active actor pointer | `activeCharacterId: string \| null` per store |
| Most-recent ordering | `updatedAt: string` ISO 8601 on each actor |
| Highest risk | localStorage migration · active-actor pointer call sites · runtime actor reference |
| Deferred | Campaign binding store · cross-system unified vault · undo/trash · multi-actor count enforcement |

---

## Document History

| Date | Change |
|---|---|
| 2026-06-14 | Initial — Multi-Actor Store Architecture Review v1 (architecture review only; no `src/` change) |
