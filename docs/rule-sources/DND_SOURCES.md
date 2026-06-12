# DND Rule Sources

## System Scope

- System: DND
- Scope: DND 5e 2024 + Xanathar's Guide to Everything + Tasha's Cauldron of Everything

## Source Authority

- Authority: owner-provided source.
- Current owner-provided root source: https://github.com/DND5eChm
- Repository-level source selection requires owner confirmation.
- The repository entries below are recorded project source references; they do not make any single subrepository the sole canonical DND source unless the owner explicitly confirms that later.

## Conflict Policy

- If app data conflicts with the DND5eChm owner-provided source, the DND5eChm source wins.
- If AI-generated or model-memory data conflicts with the DND5eChm owner-provided source, the DND5eChm source wins.
- If app data contains DND entries not found in the DND5eChm source, mark them `needs-human-check` or `out-of-source`.
- If a DND item exists in the owner-provided source but not in app data, mark it `missing`; do not fabricate implementation details.
- General web search may only help locate owner-provided source URLs or paths. It must not add or override DND rules data.

## Source: dnd2024-free-rules-github

- System: DND
- Type: github
- URL: TODO: paste official/free GitHub source URL
- Version: TODO
- Scope: DND 5e 2024 public/free rules source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting DND 2024 public/free rules data.

## Source: dnd2024-free-rules-pdf

- System: DND
- Type: pdf
- Local Path: TODO: paste local DND 5e 2024 free rules PDF path
- Version: TODO
- Scope: DND 5e 2024 public/free rules source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting DND 2024 public/free rules data.

## Source: dnd5echm-main

- System: DND
- Type: github
- URL: https://github.com/DND5eChm/DND5e_chm
- Scope: Chinese DND 5e translated resource integration
- Use: source verification / Chinese naming / manifest building / data correction reference
- Notes:
  - Use only as a specified project source.
  - Do not rely on model memory when extracting DND classes, subclasses, spells, feats, backgrounds, species, or equipment.
  - Every extracted or corrected item must cite this `sourceId` if this source was used.
  - If this source conflicts with SRD5.2 or other specified sources, mark `needs-human-check`.

## Source: dnd5echm-srd52

- System: DND
- Type: github
- URL: https://github.com/DND5eChm/SRD5.2Chm
- Scope: SRD5.2 / 2024-related DND source reference
- Use: DND 2024 / SRD5.2 manifest building and data correction reference
- Notes:
  - Prefer this source for 2024 / SRD5.2-related checks when available.
  - Every extracted or corrected item must cite this `sourceId` if this source was used.
  - If content is absent, mark missing or `needs-human-check`; do not fabricate.

## Source: dnd5echm-web

- System: DND
- Type: github
- URL: https://github.com/DND5eChm/5echm_web
- Scope: Web/static version of DND5eChm materials
- Use: browsing/search support, cross-checking Chinese entries
- Notes:
  - This is an auxiliary browsing source.
  - Do not treat web presentation structure as canonical if it conflicts with source repositories.

## Source: xgte-github

- System: DND
- Type: github
- URL: TODO: paste owner-provided XGtE GitHub source URL
- Version: TODO
- Scope: Xanathar's Guide to Everything source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: XGtE content must be marked with this extension `sourceId` and must not be blended into DND 2024 core data without source metadata.

## Source: xgte-pdf

- System: DND
- Type: pdf
- Local Path: TODO: paste local XGtE PDF path
- Version: TODO
- Scope: Xanathar's Guide to Everything source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: XGtE content must be marked with this extension `sourceId`.

## Source: tcoe-github

- System: DND
- Type: github
- URL: TODO: paste owner-provided TCoE GitHub source URL
- Version: TODO
- Scope: Tasha's Cauldron of Everything source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: TCoE content must be marked with this extension `sourceId` and must not be blended into DND 2024 core data without source metadata.

## Source: tcoe-pdf

- System: DND
- Type: pdf
- Local Path: TODO: paste local TCoE PDF path
- Version: TODO
- Scope: Tasha's Cauldron of Everything source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: TCoE content must be marked with this extension `sourceId`.

## DND AI Rules

- For DND data correction, use only the listed DND sources.
- Do not use BG3 as a DND rule source.
- Do not use model memory to fill missing classes, subclasses, spells, feats, backgrounds, species, or equipment.
- Do not silently complete missing lists.
- Every DND item in a manifest must include `sourceId`.
- DND class, subclass, spell, feat, background, species, and equipment data must trace to `sourceId`.
- XGtE / TCoE content must identify its extension source.
- If a class, subclass, spell, feat, background, species, or equipment entry cannot be found in the listed source, mark it `missing` or `needs-human-check`.
- If sources conflict, mark `conflict-needs-human-check`.
- Do not modify runtime behavior in source-manifest tasks.
- Third-party wiki sources are forbidden unless explicitly added to this source manifest.
