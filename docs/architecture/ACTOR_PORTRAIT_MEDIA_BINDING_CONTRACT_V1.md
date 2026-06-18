# Actor Portrait Media Binding Contract v1

<!-- AI-LANDMARK: ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1 -->

Last updated: 2026-06-19
Task: `A10.9 Actor Portrait Media Binding Contract v1`
Builds on: A6 MediaAsset + Loading Strategy, A10.6 Campaign Flow, A10.7 Object Actions

This contract defines how actors bind portrait, avatar, cover, token, and
thumbnail images to existing `MediaAsset` records. It is a contract-only layer:
no upload, cropping, object storage, backend, auth, store migration, UI, campaign
UI, export binary handling, Workshop builder, Package Library UI, or rule-engine
behavior is implemented here.

## Purpose

The platform uses the neutral product term **角色** for actor-like objects.
System flavor remains in system-specific creator/detail surfaces: investigator,
Edgerunner, character, NPC, monster, unit, and future board-game pieces.

Actor images must not inline base64, blob data, or original media URLs into actor
records. An actor image slot references a `MediaAsset` by id. The `MediaAsset`
layer remains responsible for metadata, variant refs, projection-gated loading,
and placeholder fallback.

## Type Surface

Code location:

```text
src/lib/platform/actorMediaBinding.ts
```

Core types:

```ts
ActorImageSlot =
  | 'portrait'
  | 'avatar'
  | 'cover'
  | 'token'
  | 'thumbnail';

ActorImagePurpose =
  | 'characterSheet'
  | 'actorVault'
  | 'userProfile'
  | 'campaignMemberList'
  | 'campaignRuntime'
  | 'fanWorkMention'
  | 'workshopPreview';

ActorMediaBinding {
  actorId: string;
  slot: ActorImageSlot;
  mediaAssetId: MediaAssetId;
  purpose?: ActorImagePurpose;
  visibility?: 'private' | 'campaign' | 'public';
  updatedAt?: string;
}
```

Slot meanings:

- `portrait`: primary actor portrait / detail illustration.
- `avatar`: compact avatar for member lists, profile chips, and identity badges.
- `cover`: wide banner or profile cover image.
- `token`: future map, tactical board, or combat token image.
- `thumbnail`: explicit list/card thumbnail override when needed.

## Relation To MediaAsset

`MediaAsset` answers: "what is this media resource and what variants exist?"

`ActorMediaBinding` answers: "which actor slot uses which media asset?"

The binding stores only `mediaAssetId`, slot, purpose, optional visibility intent,
and update metadata. It does not duplicate the media asset payload, source refs,
dimensions, mime type, or variant refs.

Hard boundaries:

- No actor, NPC, character sheet, profile, campaign member, fan work, or Workshop
  manifest should store inline image payloads as source of truth.
- Media binary/original handling stays behind `MediaAsset`.
- Business meaning stays in actor/campaign/workshop contracts; media storage
  meaning stays in `MediaAsset`.

## Loading Rules

Default actor image loading follows the platform media loading strategy:

| Surface / purpose | Default variant |
|---|---|
| Actor Vault list/card | `thumbnail` |
| Campaign member list | `thumbnail` |
| Fan work mention | `thumbnail` |
| Workshop preview | `thumbnail` |
| Character sheet / actor detail | `preview` |
| User profile | `preview` |
| Campaign runtime / prep surface | `preview` |

`original` is never loaded by default. It may be requested only through explicit
open, download, edit, export, clone, or full backup actions governed by the
MediaAsset and export contracts.

Missing or denied media should resolve to no binding, a placeholder, or a
projection-safe fallback. The actor should remain renderable without media.

## Relation To CampaignFlow

Campaign and actor entry flows may display actor media bindings in:

- Actor Vault list/detail.
- Character detail before entering a campaign.
- Campaign detail and entry-prep identity selection.
- Campaign member lists.
- Host NPC lists.
- Campaign logs or handout references that mention actors.

Campaign entry state must not embed image payloads. It may carry actor ids and
derive safe thumbnails/previews through actor media bindings plus `MediaAsset`.

Player characters and NPCs use the same binding model. Host-owned NPC portrait
replacement is a future object action, not a special storage path.

## Relation To ObjectAction

A10.7 Object Actions already reserve media-adjacent actions such as
`useAsPortrait`, `useAsCover`, and `changeVisibility`.

Future actor-media actions may include:

- `useAsPortrait`
- `useAsAvatar`
- `useAsCover`
- `replacePortrait`
- `removePortrait`
- `changeVisibility`

These actions should produce or update `ActorMediaBinding` records only after a
future UI/storage implementation exists. This contract does not execute those
actions and does not upload or mutate media.

## Projection And Visibility

Actor media visibility is an intent attached to the binding:

- `private`: visible only to the owner or allowed editor.
- `campaign`: visible to campaign members according to campaign projection.
- `public`: allowed on public profile, fan plaza, or Workshop-facing surfaces.

The `MediaAsset` itself still has canonical projection and visibility checks.
Both the actor binding and the media asset projection must permit display. If a
viewer is denied, the projected actor DTO should omit the binding or return a
placeholder-safe result; it must not leak a private or campaign-only ref.

## Export / Import

Character export should carry actor media binding metadata and `MediaAsset` ids
or metadata references only. It should not include original media binaries by
default.

Rules:

- Character JSON export: binding metadata only.
- Platform backup: may include media metadata references.
- Full media backup/export: future explicit flow through MediaAsset/export
  envelope rules.
- Missing media on import: keep the actor valid and use placeholder fallback.
- No binary import/export behavior is implemented in this contract.

## Non-Goals

This round does not implement:

- Real upload, crop, resize, CDN, OSS, or object-store integration.
- Image editing or token image generation.
- Actor store schema or save-format changes.
- CharacterData / investigator / Edgerunner data changes.
- Campaign UI, VTT, map, token, handout, or NPC management.
- Workshop builder, fanwork composer, Package Library UI, backend, auth, or
  permission enforcement.
- Any rule-engine, runtime, dice, or system-specific gameplay behavior.

## Acceptance Boundary

The accepted output is a type-level binding contract plus documentation. Any
future UI that displays actor images should request the smallest safe
`MediaAsset` variant for its surface and treat `ActorMediaBinding` as a relation,
not as image storage.
