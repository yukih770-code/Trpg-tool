# Rule Source Manifest

## Purpose

This directory defines the only rule sources AI agents may use for future rule inventory, extraction, correction, and verification in this project.

This manifest does not add rules, implement features, change existing data, or grant permission to copy long official rules text into the repository. It establishes source discipline for later review work.

<!-- AI-LANDMARK: RULE_SOURCE_AUTHORITY_POLICY -->
## Source Authority Policy

The project owner-provided rule sources are the only authoritative sources for rules data.

AI-generated data, previously scraped data, old web-search results, model memory, third-party summaries, and existing unverified app data are non-authoritative when they conflict with owner-provided sources.

<!-- AI-LANDMARK: DND_LOCAL_CHM_PRIMARY_SOURCE_AUTHORITY -->
Updated DND source priority:

1. Local CHM extracted source at `C:\TRPG_CHM_WORK\extracted` is the primary authoritative source for DND coverage and correction.
2. GitHub DND5eChm / SRD5.2Chm sources remain secondary cross-check sources.
3. Official references are optional supplements only and do not override the local CHM source.
4. Current app data is an audit target and must be checked against the local CHM source before being treated as complete.
5. AI memory, BG3, third-party wiki pages, and unspecified web sources are forbidden as DND rule sources.

中文政策：

- DND 以本地 CHM 解包目录作为正统主源。
- GitHub 规则源只做交叉检查。
- 官方资料只是可选补充，不默认覆盖本地 CHM。
- 旧 app 数据以本地 CHM 为准重新审计。

General source priority order:

1. Owner-provided local / GitHub / PDF rule sources.
2. Owner manually confirmed content.
3. Existing project data.
4. AI previously searched or generated data.
5. Model memory / unspecified web sources.

Conflict and gap handling:

- If existing app data conflicts with owner-provided sources, the owner-provided source wins.
- If AI-generated data conflicts with owner-provided sources, the owner-provided source wins.
- If an item exists in app data but cannot be found in owner-provided sources, mark it `out-of-source` or `needs-human-check`. Do not silently keep it as verified.
- If an item exists in owner-provided sources but not in app data, mark it `missing`. Do not fabricate implementation details.
- Do not use model memory, BG3, third-party wiki, or general web search to override owner-provided sources.
- General web search may only be used to locate the owner-provided source if the URL/path is incomplete, not to add new rules.

## Project Rule Scope

| System | Scope | Source Detail |
|---|---|---|
| DND | DND 5e 2024 + Xanathar's Guide to Everything + Tasha's Cauldron of Everything | See `DND_SOURCES.md` |
| COC | Call of Cthulhu 7e | See `COC_SOURCES.md` |
| CP RED | Cyberpunk RED Core | See `CPRED_SOURCES.md` |

## Allowed Source Types

- Owner-provided local extracted sources listed in this directory, including CHM extraction directories.
- Owner-provided正版 free GitHub sources listed in this directory.
- Owner-provided正版 free local PDF sources listed in this directory.
- Future sources explicitly added to this directory by project owner review.

## Source Entry Fields

Every source entry should include:

- `sourceId`
- `system`
- `title`
- `type`: `local-chm-extracted`, `github`, or `pdf`
- `url` or `localPath`
- `version`
- `scope`
- `allowedUse`
- `notes`

## AI Extraction Rules

1. Use only listed local/GitHub/PDF sources.
2. Do not rely on model memory for rule data.
3. Do not use BG3 as a DND source.
4. Do not use third-party wiki unless explicitly added as a source.
5. Do not fabricate missing rules.
6. Do not silently fill missing subclass, spell, feat, equipment, occupation, role, weapon, armor, cyberware, or market item lists.
7. Every extracted item must include `sourceId`.
8. Every uncertain item must be marked `needs-human-check`.
9. Every AI-assisted item must be marked `ai-assisted-unverified` until manually checked.
10. Existing app behavior should not be changed by source-manifest tasks.

## DND-Specific Extraction Rules

1. For DND data correction, use only the listed DND sources in `DND_SOURCES.md`.
2. Do not use BG3 as a DND rule source.
3. Do not use model memory to fill missing subclasses, spells, feats, backgrounds, species, or equipment.
4. Do not silently complete missing DND lists.
5. Every DND item in a manifest must include `sourceId`.
6. If a class, subclass, spell, feat, background, species, or equipment entry cannot be found in the listed source, mark it `missing` or `needs-human-check`.
7. If listed DND sources conflict, mark `conflict-needs-human-check`.
8. Do not modify runtime behavior in source-manifest tasks.

## Metadata Requirement

All future extracted or corrected rule data must record:

- `sourceId`
- `sourceRef`
- `trustLevel`
- `publicScope`
- `contentPolicy`
- `verifiedAt` when manually verified

If a source does not clearly support a data item, the item must be marked `needs-human-check` instead of completed from memory.

## Forbidden Sources Unless Added Here

- BG3 / Baldur's Gate 3 data.
- Unofficial wiki pages.
- Forum summaries.
- Reddit summaries.
- AI model memory.
- Unattributed OCR dumps.
- Unreviewed translated rule compilations.

## Content Boundary

Public/free sources may be used only within their allowed scope. Paid-book or official-but-not-public content may be referenced by source metadata, but long rules text must not be copied into the repository.

Homebrew, demo, placeholder, and AI-assisted data must be visibly labeled or quarantined before being treated as runtime/core data.
