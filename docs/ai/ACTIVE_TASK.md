# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Workshop + Fan Plaza Dedicated Detail Pages v1
- Name: WORKSHOP_FAN_PLAZA_DEDICATED_DETAIL_PAGES_V1
- Goal: Split browse vs. full detail. Browse pages keep a lightweight quick preview; full detail now opens a dedicated detail view (page-internal state, no real router) that replaces the browse surface and offers a back button. Frontend views + static mock read + i18n + docs only.
- Phase: P1 platform UX / IA
- Status: Done (pending local tsc/build verification — sandbox unavailable)

## Result Summary

- Workshop: `WorkshopShell.tsx` adds `detailId` + `openDetail()`; when set, returns `WorkshopItemDetail` (new component) instead of the browse/subscriptions surface. Browse card main area is a `<button>` → `openDetail`; a separate "快速预览" button toggles the now-LIGHTWEIGHT quick preview (small cover + title + author + 1-line summary + system/category/version/dependency/impact + 进入详情 + subscribe reserved). Card footer also has 进入详情.
- `WorkshopItemDetail.tsx` (new): back bar → workshop, hero cover + gallery, long description, version/dependency/impact/landing info card, includes, related fan works + related actors/campaigns/logs, share code/public path (synthesized WS-…/ /share/workshop/…), reserved load-order/changelog/comments/author-works/related-recommend.
- Fan Plaza: `FanPlazaShell.tsx` adds `detailWorkId` + `previewWorkId` + `openDetail()`; when detail set, returns `FanWorkDetail` (now a dedicated page with `onBack`) instead of browse. `FanWorkCard.tsx` main area `<button>` → `onOpenDetail`; separate 快速预览 → `onQuickPreview`; lightweight preview panel rendered inline in the shell.
- `FanWorkDetail.tsx`: converted from inline panel to dedicated page (`<main>` + back-to-plaza bar top & bottom, `onBack` replaces `onClose`); keeps hero cover, body, media placeholders, related objects, related Workshop content, share/permission, engagement; adds a Comments section + related-recommend reserved.
- i18n (`zh-CN.ts` + `en.ts`): `workshop.card.enterDetail`; new `workshop.detail.*` (back/backToWorkshop/pageTitle/gallery/longDescription/versionInfo/dependencies/impactScope/landing/includes/loadOrderReserved/changelogReserved/comments/commentsReserved/authorWorksReserved/relatedRecommendReserved); `fanPlaza.card.enterDetail`/`quickPreview`; `fanPlaza.detail.backToPlaza`/`pageTitle`/`commentsSection`/`relatedRecommendReserved`.
- NO real React Router / URL / browser History; no real upload/download/subscribe/like/favorite/comment/backend; no store/schema/save/rule-data/Builder/dice/runtime/Actor Vault adapters change.

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
rg -n "WORKSHOP_FAN_PLAZA_DEDICATED_DETAIL_PAGES_V1|WorkshopItemDetail|openDetail|detailWorkId" src
```
