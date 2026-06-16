# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Workshop + Fan Plaza Visual Preview Refinement v2
- Name: WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2
- Goal: Give the Workshop a visual-resource-market layout (image-preview cards in a responsive grid, quick preview with big cover + gallery + related fan works/actors/campaigns/logs) and the Fan Plaza a multimodal creator-community layout (cover-from-coverMode cards, content-block summaries, media placeholders, related Workshop content). Frontend UI + static mock + placeholder visuals only.
- Phase: P1 platform UX / IA
- Status: Done (pending local tsc/build verification — sandbox unavailable)

## Result Summary

- New: `src/components/platform/PreviewArt.tsx` — unified static cover/preview (CSS gradient + glyph / audio waveform). No external images. Keyed by workshopKind / fanKind + coverMode + gallery/audio badges.
- `src/lib/platform/workshopTypes.ts`: `WorkshopPreviewImageKind`, `WORKSHOP_PREVIEW_KIND_MAP`, `workshopPreviewKind()`, + `previewImageKind`/`previewAccent`/`galleryPreviewKinds` on `WorkshopBrowseItem`; all 6 browse samples set.
- `src/lib/platform/communityTypes.ts`: `FanWorkCoverMode`, `FanWorkContentBlockKind`; FanWork gains `coverMode`/`coverKind`/`coverLabel`/`contentBlocks`/`relatedWorkshopItemIds`.
- `src/lib/platform/communityMockData.ts`: 5 works augmented (coverMode/contentBlocks/relatedWorkshop); `fanWorkCoverKind()`, `getRelatedWorkshopItems()`, `getRelatedFanWorkIdsForWorkshopItem()` (now maps sample ids too).
- `src/components/platform/WorkshopShell.tsx`: image-preview cards in `sm:2 lg:3 xl:4` grid; quick preview = big cover + gallery + related fan works (mini cards) + related actors/campaigns/logs chips + detail-structure note. Container widened to `max-w-6xl`.
- `src/components/platform/FanWorkCard.tsx`: cover-forward (4:3) by coverMode, content-block summary chips, gallery/audio badges, counts display-only.
- `src/components/platform/FanWorkDetail.tsx`: big cover, content-block summary, media placeholders (image/gallery/audio/external link), related objects, related Workshop content (needs `locale`), share/permission/engagement reserved.
- `src/components/platform/FanPlazaShell.tsx` + `src/pages/FanPlaza.tsx`: image-forward grid (`sm:2 lg:3`), thread `locale`, `max-w-6xl`.
- i18n (`zh-CN.ts`/`en.ts`): top-level `previewArt.*`; `workshop.card.*` (cover/gallery/related*/detailStructureNote); `fanPlaza.card.*`, `fanPlaza.contentBlock.*`, `fanPlaza.coverMode.*`, `fanPlaza.layout.*`, `fanPlaza.detail.*` (cover/media/relatedWorkshop).
- NOT changed: store/schema/save format/rule data/Builder/dice/runtime/Actor Vault adapters/system internal logic/real routing. No real upload/download/subscribe/like/favorite/comment/backend.

## Forbidden Changes (respected)

- store / schema / migration / save format / rule data / Builder logic / creation steps / spell/class/species/equipment data / dice / runtime
- Actor Vault adapters / DND·COC·CP RED internal logic / Campaign·Module·Session real functionality / real URL routing / browser History API
- real upload / download / subscription / like / favorite / comment / permission system

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```

Sandbox unavailable this round — run locally to confirm green.

## Locate

```powershell
rg -n "WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2|PreviewArt|coverMode|contentBlocks|previewImageKind" src
```
