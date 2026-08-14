# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: DND Personal Content AI Drafting v1
- Name: `DND_PERSONAL_CONTENT_AI_DRAFTING_V1`
- Goal: Embed schema-bounded AI drafting into the existing private DND content workbench so an authenticated author can generate, deterministically validate, preview, and explicitly apply an original-content draft to the unsaved form before using the existing immutable-version save and Room-review chain.
- Phase: Internal AI foundation / structured private creation
- Status: Complete

## Layer Declaration

- IA: Existing Workshop private `我的创作` Create/Add Flow and the existing authenticated Model Gateway backend boundary; no new page, modal, global AI entry, public Workshop listing, or Room control.
- Object: Suggested owner-private DND CatalogObject draft only. Existing saved personal pack/version records remain the persistence container and are not mutated by AI generation or form application.
- State: UI State for expansion/status/input/preview; Flow State for model suggestion and unsaved form fields; transient Server State for one request. Existing Persistent Domain State writes remain solely behind the workbench's current explicit immutable-version publish APIs.
- Excluded: WorkshopPackage installation/publication, PackageLibraryEntry, official compendium data, Actor, Campaign, Room, Runtime, rules execution, schema/migration, collaborative editing, cloud billing.

## Page Responsibility And Action Hierarchy

- The private content workbench remains responsible for authoring, collecting, previewing, and explicitly saving private DND rule entries.
- It remains not responsible for public discovery/publication, package installation, Room admission, character ownership, Runtime execution, or official rule reproduction.
- Primary CTA remains the existing save-as-immutable-version action after entries enter pending content.
- `智能起草` is a collapsed secondary creation-flow surface. Generate/cancel, preview, discard, and apply-to-form stay inside it.
- Applying an AI plan changes only the current unsaved form. `加入待保存内容` and final save remain separate explicit human actions.
- Hidden actions: automatic add/save/publish, official-content copying, executable effects, Room approval, server adoption, background generation, public sharing, and direct database writes.

## Allowed Files

- `src/lib/ai/dndPersonalContentAssistantTypes.ts`
- `src/lib/ai/dndPersonalContentAssistant.ts`
- focused frontend smoke
- `server/ai/modelGateway.ts`, `server/ai/modelRoutingGateway.ts`
- focused API handlers/routes/smoke and server registration/index
- `src/lib/api/aiModelGatewayApiClient.ts` and focused smoke
- `src/components/platform/DndPersonalContentAssistantPanel.tsx`
- `src/components/platform/DndPersonalSpeciesPackPanel.tsx`
- `package.json`
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`, architecture index

## Forbidden Changes

- Personal pack repository/API persistence semantics, DB schema/migrations, save format, official/local rule data, character store, Campaign, Room, Runtime, permissions, public Workshop, package install, media, cloud provider/billing
- Any modal/chat/global AI surface or automatic/background persistent write
- `output/`, `tools/`, `work/`

## Completion Criteria

- All current DND personal editor kinds use one shared bounded field vocabulary and per-kind allowlist.
- Authenticated route runtime-validates intent, locale, entry kind, bounded current form values, model output, and model routing without exposing provider configuration.
- Deterministic client plan rejects kind mismatch, duplicates, unsupported fields, invalid enums/numbers/line formats, silent truncation, missing required identity, and no-op output.
- Inline UI covers route status, editable intent, loading, cancellation, unavailable/error/retry, structured preview, warnings/issues, discard, explicit apply, and stale-form protection.
- Apply changes only unsaved fields. Existing add-to-pending, immutable save/version, ownership, private visibility, and Room review paths remain unchanged.
- Focused handler/client/plan smokes, existing personal-content/version/import regressions, model routing/policy checks, navigation/modal audit, TypeScript, server/frontend builds, diff check, docs, cleanup, and one isolated commit pass.
