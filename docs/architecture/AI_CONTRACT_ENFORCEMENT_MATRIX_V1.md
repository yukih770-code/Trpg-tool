# AI Contract Enforcement Matrix v1

<!-- AI-LANDMARK: AI_CONTRACT_ENFORCEMENT_MATRIX_V1 -->

Last updated: 2026-06-21

Status: global mandatory governance contract.

This document classifies architecture documents by enforcement level. It exists
so AI implementation and audit rounds can distinguish binding contracts,
triggered domain contracts, alignment documents, historical references, and
merge / rename candidates.

This document does not implement UI, store writes, schema migration, runtime
logic, backend, multiplayer, permissions, import/export behavior, rules engines,
or repository behavior.

## 1. Purpose

The project has many architecture documents. Treating every document as equally
binding creates noise, while treating every document as passive reference allows
important boundaries to drift.

This matrix defines:

- which documents are always mandatory;
- which documents become mandatory when a task touches their domain;
- which documents must be aligned with but are not always line-by-line gates;
- which documents are reference or historical planning material;
- how conflicts are resolved;
- how reports must prove compliance.

## 2. Enforcement Levels

### Level 0: Global Mandatory

Every implementation, audit, or governance task must read and follow Level 0
documents before editing or reporting.

Violation means the task is non-compliant.

### Level 1: Triggered Mandatory

Level 1 documents are mandatory when the task touches their domain. The AI must
read and strictly execute the relevant Level 1 contracts before editing.

If a task touches a Level 1 domain and the document is missing, the AI must
report `Missing` and stop rather than guessing.

### Level 2: Alignment Required

Level 2 documents define architecture direction, phase context, or specialized
plans. They are not always strict line-by-line gates, but related work must read
and align with them.

A Level 2 document can be temporarily treated as Level 1 when the task directly
modifies its domain. The report must say when this escalation happens.

### Level 3: Reference

Level 3 documents are background, snapshot, historical plan, external-reference
translation, or future-roadmap material. They help understand direction, but
they cannot override current repository state or Level 0 / Level 1 contracts.

### Deprecated / Merge / Rename Candidate

This status does not delete a document. It means the document should be reviewed
in a later governance round for rename, merge, deprecation, or deletion.

Default action is to report the recommendation and keep the file.

## 3. Conflict Priority

When documents conflict, apply this priority:

1. Current repository state and explicit user task scope.
2. Safety, data integrity, and no destructive action.
3. Level 0 governance contracts.
4. Triggered Level 1 domain contracts.
5. Level 2 alignment documents.
6. Level 3 reference documents.
7. Old roadmaps, old task plans, and historical notes.

Rules:

- Old plans cannot override current code reality.
- A UI shell does not prove real implementation.
- A documentation contract does not prove code implementation.
- A placeholder does not prove persistence, backend, multiplayer, permissions,
  map, handout, Workshop, or AI behavior.
- If an MVP scope conflicts with a higher-priority architecture contract, stop
  and report.

## 4. Global Mandatory Documents

| Document | Level | Requirement |
| --- | --- | --- |
| `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` | Level 0 | Read every implementation/audit round. Apply layer declaration, triggered-contract checks, stop conditions, and final `Execution Rules Compliance`. |
| `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` | Level 0 | Read every implementation/audit round after adoption. Use it to identify triggered Level 1 and related Level 2 documents. |

## 5. Triggered Mandatory Documents

| Trigger | Level 1 Document(s) | Enforcement Requirement |
| --- | --- | --- |
| Actor to campaign entry, suggested actor, selected actor, campaign entry draft, membership, participant, host/player authority, CampaignActorInstance, RuntimeActor, RuntimeSession | `CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md` | Preserve ActorVaultActor / CampaignActorInstance / RuntimeActor / membership boundaries. Do not persist selected actor context as membership. |
| Runtime shell, Host View, Player View, runtime header, actor rail, action dock, runtime projection, local runtime context | `CAMPAIGN_RUNTIME_SHELL_CONTRACT_V1.md` | Preserve post-entry runtime boundary. Do not imply backend, multiplayer, map, handout, permissions, or rules runtime. |
| RuntimeLog lifecycle, correction, hide, tombstone, dev clear, physical delete, RuntimeLog export/import | `RUNTIME_LOG_LIFECYCLE_CORRECTION_POLICY_CONTRACT_V1.md` | Prefer append/correction/tombstone semantics. Keep delete/clear as dev or explicit purge policy. Do not treat RuntimeLog as AuditLog, rules engine, permission proof, or actor mutation. |
| Lifecycle status, archive, restore, trash, purge, deletion warning, recovery, reference safety | `DATA_LIFECYCLE_AND_DELETION_POLICY_V1.md` | Prefer recoverable lifecycle actions. Do not expose dev clear/reset as ordinary product delete. Preserve references or warn. |
| Data management MVP, local stores, backup, import, export, restore, local personal campaign workflow | `DATA_MANAGEMENT_MVP_SCOPE_V1.md` | Stay inside offline local MVP. Do not implement backend, multiplayer, full permissions, full CampaignMembership, full CampaignActorInstance, maps, or Workshop installer. |
| Platform UI, button labels, Add Flow, ContextBar, page responsibility, navigation chrome, campaign entry UI, runtime projection UI | `PLATFORM_INTERACTION_UI_CONTRACT_V1.md` and `NAVIGATION_AND_EXIT_CONTRACT_V1.md` | Preserve button semantics, one primary action, ContextBar rules, icon-only return, no duplicate visible return chrome. |
| Character sheet, builder/sheet/audit/catalog boundaries, DND / COC / CP RED sheet layout or data display | `CHARACTER_SHEET_UX_CONTRACT_V1.md` | Preserve Sheet / Builder / Audit / Catalog separation. Do not put full catalogs in default sheet. |
| Import/export envelope, backup format, import preview, validation, conflict handling, corrupt-object isolation | `EXPORT_IMPORT_ENVELOPE_V2.md` | Validate before write, preview before commit, isolate corrupt objects, distinguish backup import from Workshop/package install. |
| Object actions, destructive action state, object card actions, package entry actions, management actions | `OBJECT_MANAGEMENT_ACTION_CONTRACT_V1.md` | Separate object management from campaign entry. Keep destructive actions explicit and stateful. |
| Repository/service composition, data access boundary, projection enforcement, replacing mock/local/api repositories | `REPOSITORY_IMPLEMENTATION_BOUNDARY_V1.md` and `ENTITY_GRAPH_AND_REPOSITORY_LAYER_V1.md` | Keep UI out of concrete repositories and mock data. Use service/repository boundary and projection enforcement. |
| Visibility projection, public/internal entity views, viewer context, permission projection repositories | `VISIBILITY_AND_PROJECTION_CONTRACT_V1.md` | Treat projection as view shaping, not proof of server authority. Do not leak private/original media. |
| MediaAsset, loading, actor portrait media binding, image variants, media export/import, media visibility | `MEDIA_ASSET_AND_LOADING_STRATEGY_V1.md` and `ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1.md` | Use MediaAsset references and variants. Do not invent upload/storage behavior without scope. |
| BlockDocument, handout document records, entity/media refs inside documents | `BLOCK_DOCUMENT_PROTOCOL_V1.md` | Preserve BlockDocument record structure and entity/media ref boundaries. |
| Workshop package manifest, package library entry, content package install/update/remove/rollback/dependency behavior | `WORKSHOP_PACKAGE_MANIFEST_V1.md` and `PACKAGE_LIBRARY_CONTRACT_V1.md` | Distinguish manifest from joined package entry. Do not treat content pack install as trusted execution. |
| Frontend/backend/local server split, future local server architecture, database/media backup structure | `FRONTEND_BACKEND_WORKSPACE_BOUNDARY_V1.md` | Do not introduce backend/cloud/local server work unless explicitly scoped. Preserve front/back/shared boundary plan. |

## 6. Alignment Required Documents

| Document | Level | Alignment Rule |
| --- | --- | --- |
| `REFERENCE_ARCHITECTURE_APPLICATION_GUIDE_V1.md` | Level 2, upgrade to Level 1 for broad architecture or cross-layer work | Align object layers, state layers, import validation, map/canvas strategy, runtime/multiplayer boundaries, character sheet separation, and anti-patterns. |
| `AI_IMPLEMENTATION_HANDOFF_CONTRACT_V1.md` | Level 2 | Use for multi-model handoff, task framing, and completion-report shape. Does not override Level 0 execution rules. |
| `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` | Level 2, upgrade for workspace/shell tasks | Align system workspace, actor workspace, session/campaign workspace, builder/sheet/runtime patterns, and three-state planned/implemented semantics. |
| `UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md` | Level 2, upgrade for UI action tasks | Align action tier placement and page responsibility. Related but narrower than `PLATFORM_INTERACTION_UI_CONTRACT_V1.md`. |
| `SYSTEM_ENTRY_AND_CAMPAIGN_FLOW_CONTRACT_V1.md` | Level 2, upgrade for system entry/campaign flow tasks | Align system entry, character library to campaign flow, campaign instance entry, and return-context handoff. |
| `PLATFORM_CORE_CONCEPTS.md` | Level 2 | Align vocabulary, Game System Registry baseline, platform positioning, and implementation freeze boundaries. |
| `GRAPH_PERSISTENCE_DECISION_V1.md` | Level 2 | Align future graph/local/private-first persistence decisions. Do not treat it as current persistence implementation. |
| `NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` | Level 2 | Align navigation model when changing Back / Up / Breadcrumb semantics. `NAVIGATION_AND_EXIT_CONTRACT_V1.md` remains the binding UI gate. |
| `MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md` | Level 2 | Align future multi-actor vault work. Review-only unless the task directly scopes multi-actor implementation. |

## 7. Reference Documents

| Document | Level | Reference Use |
| --- | --- | --- |
| `CURRENT_PLATFORM_ARCHITECTURE_SNAPSHOT_V1.md` | Level 3 | Current-state audit snapshot from a prior round. Useful context, not a substitute for reading current code. |
| `PLATFORM_GAP_AUDIT_AND_REPLAN_V1.md` | Level 3 | Gap audit and roadmap guidance. Does not override current task scope or current repository state. |

## 8. Conditional / Domain Documents Inventory

These documents are Level 1 when directly touched and Level 2 otherwise:

| Document | Default Level | Trigger Summary |
| --- | --- | --- |
| `ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1.md` | Level 2 / triggered Level 1 | Actor portrait/avatar/token media binding. |
| `BLOCK_DOCUMENT_PROTOCOL_V1.md` | Level 2 / triggered Level 1 | BlockDocument records, document refs, handout/document protocol. |
| `ENTITY_GRAPH_AND_REPOSITORY_LAYER_V1.md` | Level 2 / triggered Level 1 | EntityGraph and repository interfaces. |
| `EXPORT_IMPORT_ENVELOPE_V2.md` | Level 2 / triggered Level 1 | Export/import envelope and dry-run validation. |
| `FRONTEND_BACKEND_WORKSPACE_BOUNDARY_V1.md` | Level 2 / triggered Level 1 | Local server / backend workspace split. |
| `MEDIA_ASSET_AND_LOADING_STRATEGY_V1.md` | Level 2 / triggered Level 1 | MediaAsset variants, loading, cache/index boundaries. |
| `PACKAGE_LIBRARY_CONTRACT_V1.md` | Level 2 / triggered Level 1 | Joined package management. |
| `WORKSHOP_PACKAGE_MANIFEST_V1.md` | Level 2 / triggered Level 1 | Workshop manifest, package refs, source trust. |
| `VISIBILITY_AND_PROJECTION_CONTRACT_V1.md` | Level 2 / triggered Level 1 | Visibility and projection. |

## 9. Missing / Planned Documents

The following names may appear in plans or handoffs but are not present in the
current repository as of this matrix:

| Planned Name | Status | Governance Rule |
| --- | --- | --- |
| `RUNTIME_LOG_LIFECYCLE_AND_CORRECTION_POLICY_V1.md` | Missing | Do not guess. Use existing `RUNTIME_LOG_LIFECYCLE_CORRECTION_POLICY_CONTRACT_V1.md` unless a later rename task is approved. |
| `RUNTIME_OBJECT_PROJECTION_CONTRACT_V1.md` | Missing | Do not cite as implemented. Use `CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md`, `CAMPAIGN_RUNTIME_SHELL_CONTRACT_V1.md`, and `VISIBILITY_AND_PROJECTION_CONTRACT_V1.md` for current boundaries. |
| `LOCAL_EXPORT_ENVELOPE_CONTRACT_V1.md` | Missing | Do not cite as implemented. Use `EXPORT_IMPORT_ENVELOPE_V2.md` plus `DATA_MANAGEMENT_MVP_SCOPE_V1.md` until a local backup/export-specific contract is added. |
| `DND_CHARACTER_SHEET_UX_CONTRACT_V1.md` | Missing | Do not create a duplicate unless a task explicitly scopes system-specific sheet UX. Use `CHARACTER_SHEET_UX_CONTRACT_V1.md`. |

## 10. Rename / Merge Candidates

| Document | Candidate Type | Recommendation |
| --- | --- | --- |
| `RUNTIME_LOG_LIFECYCLE_CORRECTION_POLICY_CONTRACT_V1.md` vs planned `RUNTIME_LOG_LIFECYCLE_AND_CORRECTION_POLICY_V1.md` | Rename candidate | Keep current actual filename for now. Consider rename later only if the team wants names to match the original task phrase. Do not keep both. |
| `PLATFORM_INTERACTION_UI_CONTRACT_V1.md`, `UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md`, `NAVIGATION_AND_EXIT_CONTRACT_V1.md`, `NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` | Merge / hierarchy candidate | Keep separate for now. Treat `PLATFORM_INTERACTION_UI_CONTRACT_V1.md` + `NAVIGATION_AND_EXIT_CONTRACT_V1.md` as binding gates, others as alignment unless directly triggered. |
| `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md`, `AI_IMPLEMENTATION_HANDOFF_CONTRACT_V1.md`, `REFERENCE_ARCHITECTURE_APPLICATION_GUIDE_V1.md` | Role-overlap candidate | Keep separate. Execution rules are gate, handoff is coordination, reference guide is architecture principles. |
| `EXPORT_IMPORT_ENVELOPE_V2.md` and planned `LOCAL_EXPORT_ENVELOPE_CONTRACT_V1.md` | Split candidate | Keep `EXPORT_IMPORT_ENVELOPE_V2.md`; add local export contract later only if local backup/export UI needs narrower MVP rules. |

## 11. Compliance Report Requirements

Reports must not merely say:

```text
Read XXX: yes
```

They must use this shape for each triggered Level 1 or upgraded Level 2
document:

```text
<Contract Name> Compliance:
- Triggered this round:
- Applicable clauses:
- How this round complied:
- Deviations:
- Reason / follow-up:
```

Required global section:

```text
Execution Rules Compliance:
- AI_IMPLEMENTATION_EXECUTION_RULES_V1.md read:
- AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md read:
- Object layers touched:
- State layers touched:
- Triggered Level 1 documents:
- Related Level 2 documents:
- Navigation/back-button check:
- Button semantics check:
- Actor/Campaign/Runtime boundary check:
- Character sheet boundary check:
- Data management MVP check:
- Placeholder transparency:
- Missing documents:
- Deviations and follow-up:
```

Example:

```text
Campaign Membership Contract Compliance:
- Triggered this round: yes, campaign entry/runtime actor boundary touched.
- Applicable clauses: suggestedActor != selectedActorId; selectedActorId !=
  persistent CampaignMembership; ActorVaultActor != CampaignActorInstance.
- How this round complied: no CampaignMembership was created; no selectedActorId
  persistence was added; no CampaignActorInstance was created.
- Deviations: none.
- Reason / follow-up: none.
```

## 12. Stop Conditions

Stop and report instead of implementing when:

- a required Level 0 document cannot be read;
- a triggered Level 1 document is missing;
- a task requires a schema/migration/backend/permission/multiplayer change but
  is scoped as docs-only or UI-only;
- a plan asks to treat old roadmap text as implemented code;
- a shortcut would persist UI/flow/runtime context as domain state;
- a task would expose placeholder behavior as real data management;
- deleting, renaming, or merging architecture documents is proposed without
  explicit scope and review.

## 13. Governance Rules

1. File absence must be reported as `Missing`; do not infer content.
2. Old plans cannot override current repository state.
3. UI shell does not equal real implementation.
4. Documentation contract does not equal code implementation.
5. Local MVP store does not equal final backend schema.
6. Local export does not equal public publish or Workshop install.
7. Content pack install does not equal trusted execution.
8. AI draft does not equal committed object.
9. Host / Player projection does not equal real permission.
10. RuntimeLog does not equal rules engine, permission system, multiplayer
    protocol, or AuditLog.

## 14. Maintenance

Update this matrix when:

- a new architecture contract is added;
- a document is renamed, merged, deprecated, or deleted;
- a Level 2 document becomes a binding gate;
- a missing planned document is created;
- reporting requirements change.

Do not silently change enforcement level in an implementation task. Report the
governance change clearly and keep it docs-only unless the user explicitly
requests code work.

