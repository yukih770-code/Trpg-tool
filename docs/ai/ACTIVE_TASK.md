# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Campaign AI Creative Seeds v1
- Name: `CAMPAIGN_AI_CREATIVE_SEEDS_V1`
- Goal: Extend the cited Campaign AI artifact flow with worldbuilding and adventure/dungeon creative proposals that remain visibly distinct from established campaign facts.
- Phase: Internal AI foundation / campaign creation assistance
- Status: Complete

## Layer Declaration

- IA: Campaign detail contextual host tool.
- Object: read-only CampaignObject summaries and viewer-owned GeneratedArtifact.
- State: UI State, Flow State, transient Server State, Persistent Domain State.
- Excluded: CatalogObject mutation, CampaignMembership, RuntimeObject, RuntimeLog, Collaborative State, maps, rules adjudication, Workshop recommendation, cloud billing.

## UI And Action Declaration

- Extend the existing secondary `AI 备团与回顾` panel; add no page, nav item, chat box, Back/Home/exit control, or parallel AI entry.
- Add `世界观提案` and `冒险 / 地下城种子` beside existing preparation/recap task choices.
- Creative outputs must be labeled as proposals, not current campaign facts, official adventures, available Workshop items, or actions already applied.
- `生成带来源草稿` remains preview-only; `确认并保存` remains the sole persistent action.

## Safety And Persistence

- Reuse the existing authenticated edit-authority, explicit source selection, retrieval preflight, post-fetch scope guard, citation whitelist, TTL/context binding, stale fingerprint, atomic persistence, owner-private projection, archive, and restore boundaries.
- Creative tasks may invent proposals, but must not invent citations or claim proposals came from sources. Citations indicate constraints/inspiration only.
- No schema or migration change; existing saved v1 preparation/recap artifacts remain readable.

## Allowed Files

- `src/lib/ai/campaignArtifactAssistantTypes.ts`
- `server/api/campaignArtifactAssistantHandlers.ts`
- `server/api/campaignArtifactAssistantHandlersSmoke.ts`
- `src/components/platform/CampaignAiArtifactPanel.tsx`
- focused campaign artifact smokes
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`

## Forbidden Changes

- Membership, Actor, Room, Runtime, RuntimeLog, permission, account, schema, or migration writes
- AI state auto-apply, ProposedCommand, autonomous Host actions, public/shared artifacts
- Workshop/dungeon catalog claims or recommendation ranking without real eligible objects
- `output/`, `tools/`, `work/`

## Completion Criteria

- Both creative tasks pass shared parsing, task matching, citation validation, stale confirmation, and owner-private persistence.
- UI visibly distinguishes factual tasks from creative proposals and warns that proposals are not campaign facts until humans adopt them separately.
- Existing preparation/recap artifacts and all existing AI routes continue to pass.
- TypeScript, server/frontend builds, diff checks, documentation, and one isolated commit pass.
