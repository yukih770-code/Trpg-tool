# D&D Session-Ready V1

Verdict: **PASS WITH DOCUMENTED LIMITATION**. The supported V1 path is session-ready. This record is based on the production UI, authoritative server paths, an isolated real PostgreSQL 18 instance, a compiled backend, and separate host/player/spectator browser contexts.

## 1. Baseline

The existing live-play, IA, journey, quick-Actor, consolidation, and gap-audit documents were treated as settled input. The initial file hashes are in `session-ready/baseline.json`.

Production tracing confirmed that Create NPC and custom Monster both open the full canonical D&D Actor sheet, with quick presets embedded inside it. Monster Catalog remains the normal Monster path. There is no reachable intermediate NPC form. D&D 2024 is the only public active system; saved CoC 7e and Cyberpunk RED records remain preserved behind an honest paused-system notice.

The 24 frontend-only files in `session-ready/dead-frontend.json` were deleted after import and route tracing. CoC/CPR models, stores, adapters, rules, IDs, persistence, migrations, and saved-data compatibility remain.

## 2. Asset Pipeline architecture

The pipeline extends the existing `asset_metadata` and `object_storage_refs` identities. `AssetObjectStore` is the single byte-storage port and `LocalFilesystemAssetObjectStore` is its current local/self-hosted adapter. `ASSET_STORAGE_DIR` selects the durable root; the default is `.data/assets`, which is ignored by Git. PostgreSQL continues to own metadata and generated storage references.

`platformAssets` coordinates validation, generated IDs, object writes, metadata transactions, listing, and authorized reads. `assetApiRoutes` exposes authenticated image upload/list/content endpoints. `assetApiClient` and the reusable `AssetPicker` are the only frontend upload/selection implementation.

## 3. Asset security and permission model

Uploads support PNG, JPEG, and WebP, with a 20 MiB encoded limit and a 40-million-pixel decoded limit. Sharp fully decodes and re-encodes accepted input to WebP, which rejects format spoofing and strips metadata. Animated/multipage images are rejected. Clients never choose filesystem paths or object keys.

Owners may list/read their assets. Another viewer must be an authenticated active room member and the asset must occur in that viewer's current projected room map. Hidden Token projection therefore also gates its image. An asset removed from the current room projection no longer gains room-based read access. Content routes serve generated asset IDs and never arbitrary paths.

Bytes are written before the metadata transaction. If the database result is uncertain, the object remains inaccessible rather than risking deletion of bytes whose metadata may have committed. Automated orphan collection is deferred.

## 4. Map Asset lifecycle

`backgroundAssetId` is authoritative for uploaded maps. `backgroundUrl` remains for compatible HTTP/HTTPS backgrounds, with the asset ID taking precedence when present. Map types, validation, append events, projection, replay, snapshots, rendering, reconnect, and startup recovery carry the asset ID. Resolved content URLs are presentation values and are never persisted.

The live run uploaded a 960×640 PNG, stored and served it as WebP, selected it as the room map, and recovered the same asset after repeated backend restarts. Legacy HTTPS source tests still pass.

## 5. Token Asset decision

Token portraits use additive `imageAssetId` in the existing Token model and the same `AssetPicker`, upload API, object store, authorization path, map event stream, and replay path. No second portrait system or Actor-image domain was introduced. Legacy external `imageUrl` remains compatible.

## 6. T13 condition model

`Combatant.conditionStates` carries opaque `{ systemId, conditionId, level? }` values. D&D owns the 15 IDs and localized names in `dndConditions`; Platform and generic combat replay do not encode D&D semantics. The identities come from the approved local indexed `dnd-local-chm-primary` condition source.

The host sends a condition intent. `changeDndCondition` validates D&D identity and exhaustion level, authorizes the host, reconstructs current combat state, appends one partitioned server-resolved `combat.conditions_updated` event, confirms durability, projects the result, and indexes the intent for concurrent-safe idempotency. Level zero removes exhaustion; toggling a normal condition removes it.

## 7. Condition mechanics supported

The 15 supported identities are Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, and Unconscious. Exhaustion records levels 1–6.

This release supports authoritative identity/state, add/remove, localized display, projection, RuntimeLog history, replay, reconnect, and restart recovery. Effects, duration, concentration, movement restrictions, advantage/disadvantage, exhaustion penalties, death, and recovery remain explicitly GM-adjudicated. The UI states that boundary and does not imply complete mechanical automation.

## 8. Spell-manager consolidation

Creator and Gameplay now render the same `DndSpellManager` over the same pure `spellManagement` transitions. Creator still supplies creation-time availability and finalization constraints; Gameplay supplies the persisted known/prepared spellbook. Both keep the existing preparation-limit model, remove preparation when a spell is forgotten, retain removable saved choices that are no longer selectable, and do not consume slots inside the editor.

| Capability | Canonical behavior | Lifecycle difference |
|---|---|---|
| Availability | Indexed class/level and personal-source choices | Creator supplies current creation choices; Gameplay retains learned personal spells |
| Learn/forget | One transition; forgetting also unprepares | None |
| Prepare | Must be known and within the existing preparation limit | Creation readiness still applies only in Creator |
| Slot use | Never performed by the editor | Gameplay casting uses the runtime resource action |

## 9. T14 resource model

`runtime.resource_changed` records authoritative D&D resource operations separately from Actor definitions. Accepted CampaignActor CharacterData supplies existing spell slots, pact slots, class resources, and known/prepared spells. Canonical NPC/custom-Monster sheets may define explicit capacities. No spell-slot progression, class-resource formula, or rest rule was invented.

An approved player may spend their own Actor resources; the host may control any authorized Actor and may set a current value within its accepted capacity. Casting validates that the spell is available and that the chosen slot is sufficient. Cantrips spend no slot. Spell effects remain adjudicated. Once a session has a recorded pool, that current/capacity state wins for the session and never writes back to CharacterData. There is no automatic short/long-rest engine.

## 10. Saving throw authority model

The intent carries the Actor, ability, roll mode, optional host challenge, and idempotency identity. `readDndActorPlayData` reads the accepted Actor snapshot or canonical authored sheet. `resolveDndSavingThrow` derives the save modifier server-side, uses the crypto-backed T1 roller, applies advantage/disadvantage, and returns roll(s), kept roll, modifier, total, optional DC, and success/failure.

Players may roll their own save without declaring an authoritative DC. Only the host may create a DC challenge. A player response references that immutable challenge; arbitrary player DC and modifier fields are rejected. A save has no attack-style natural-1/natural-20 automatic outcome. Projection uses an explicit allowlist. Replay records the outcome and never rolls or re-runs rules.

## 11. RuntimeLog and replay integration

The server-resolved partition now includes attacks, conditions, resources, and saving throws. Generic append rejects those kinds. `applyRuntimeResolution` remains the system-neutral mutation/append kernel; D&D resolution stays in D&D services. The resolved-intent index covers concurrency, fingerprint mismatch (409), cache eviction with RuntimeLog history fallback, and failed-append release.

Attack events retain the T12 explicit allowlist and current authoritative combatant visibility policy. Conservative shared text reports attack total/outcome and rolled damage; AC, absolute HP, and temporary HP render from structured projected fields. Conditions/resources/saves have explicit projectors and structured history renderers. Replay consumes recorded facts only.

## 12. Session-recovery behavior

The isolated PostgreSQL run applied all 12 existing migrations and reported all 11 required schema groups ready. No migration was added. A compiled backend was stopped and restarted repeatedly while the browser clients remained open.

Final startup recovery restored one room, one Actor admission, 21 pre-restart RuntimeLog events, and six map events. The uploaded WebP returned 200; background, four Token placements, authorized player movement, combat/turn state, HP 4/8, temporary HP 1, typed Poisoned state, the used level-one slot at 1/2, saves, attacks, and history recovered. The condition was then removed through the host UI as event 22 and disappeared from the player UI. WebSockets reconnected automatically.

## 13. Full session workflow

The actual host browser created/opened the campaign, created an NPC from a preset in the canonical Actor sheet, created a custom Monster through the same sheet, added a project-authored training target through Monster Catalog, uploaded/selected a local map, placed Actor Tokens, invited and approved a player, and entered the table. The host ran chat/dice, initiative, turns, two attacks, damage, healing, temporary HP, a host DC save request, condition add/remove, a spell-slot-consuming cast, and history review.

The separate player browser created a level-one Wizard in canonical Creator, selected/learned/prepared spells, submitted it, received host approval, became Ready, joined the table, rolled/chat, made a self save, answered a host save request, cast Magic Missile and spent one level-one slot, received live HP/temp HP/condition updates, was denied Token movement before permission, moved the exact admitted Token after permission, reloaded/reconnected, and resumed.

A third authenticated browser joined as spectator, received host approval, entered the live table without a Character/Ready step, saw projected map/combat/history, and could not append a Token movement.

## 14. Deferred gaps

There is no core session blocker remaining in the tested D&D path. Deliberate later scope includes automated condition effects, automatic rests/resource recovery, spell effect automation, resistance/vulnerability, advanced action economy, death saves, Fog of War, richer handout UX, object-store orphan collection, and cloud/S3 storage adapters. Mod, Workshop, scripting, federation, universal rule engines, CoC/CPR redesign, equipment overhaul, and T15+ work were not started.

CharacterData conversion deliberately does not invent weapon-attack formulas from inventory text. For a PC to use T12's weapon/spell attack selector, the campaign manager opens that bound PC from the live table with **Open campaign combat sheet**, adds the action name, kind, attack bonus, damage formula, and damage type, and saves it. The sheet persists the action in the campaign Actor override; the authoritative room endpoint then exposes it to the owning player's selector. Spell casts and free rolls remain available without that shortcut. The own-PC T12 authority path is covered by HTTP regression; this particular browser Wizard had spell casts but no authored attack shortcut, so the live browser attack was performed by the host-controlled NPC. Requiring this in-product preparation step is the documented limitation and does not require an external tool.

The walkthrough observed one pending duplicate player membership created in the disposable database before the authenticated rejoin fix. The production fix now returns the existing active/pending membership for the same authenticated user, and its lifecycle regression passes. The disposable database server, compiled backend, browser, and Vite processes were stopped after evidence capture; no configured project or production database was modified.

## 15. Test matrix

| Area | Result |
|---|---|
| Frontend typecheck | PASS, `tsc --noEmit` |
| Server build | PASS, `tsc -p server/tsconfig.build.json` |
| Frontend production build | PASS, 2,200 modules, 3,123.00 kB single-file output, 768.43 kB gzip |
| Consolidated regressions | PASS, 39/39 scripts |
| T12 resolver/kernel/intents/visibility/HTTP/boundaries/UI | PASS |
| Asset decode/upload/read/authorization/replay | PASS |
| T13 authority/idempotency/projection/replay | PASS |
| Shared spell management | PASS |
| T14 authority/casting/idempotency/projection/replay | PASS |
| Saving-throw authority/challenge/idempotency/projection/replay | PASS |
| RuntimeLog all-kind recovery | PASS, all 28 kinds through the authoritative paths |
| Room lifecycle/rejoin and Token ownership | PASS |
| Real PostgreSQL 18 / compiled backend restart | PASS, 12 existing migrations and 11/11 schema groups |
| Actual host/player/spectator browsers | PASS |

Machine-readable evidence is in `session-ready/regression-results.json`, `session-ready/live-session-evidence.json`, and `session-ready/source-changes.json`. Screenshots in the same directory cover canonical custom-Monster creation, map upload, post-restart player table, structured history, final recovered host/player tables, and spectator read-only behavior.
