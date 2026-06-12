# DND Rule Sources

## System Scope

- System: DND
- Scope: DND 5e 2024 + Xanathar's Guide to Everything + Tasha's Cauldron of Everything

## Source Authority

- Authority: owner-provided source.
- Primary authoritative source: local CHM extracted source at `C:\TRPG_CHM_WORK\extracted`.
- Primary sourceId: `dnd-local-chm-primary`.
- GitHub DND5eChm / SRD5.2Chm sources are secondary cross-check sources.
- Official references are optional supplements only and do not override the local CHM source.
- Current app data must be audited against the local CHM source before being treated as complete.
- Previous owner-provided GitHub root source retained for cross-check: https://github.com/DND5eChm

## Conflict Policy

- If app data conflicts with the local CHM owner-provided source, the local CHM source wins.
- If GitHub source data conflicts with the local CHM source, mark `conflict-needs-human-check`; do not override the local CHM by default.
- If official reference data conflicts with the local CHM source, treat it as optional supplement and mark `needs-human-check`; do not override the local CHM by default.
- If AI-generated or model-memory data conflicts with the local CHM source, the local CHM source wins.
- If app data contains DND entries not found in the local CHM source, mark them `needs-human-check` or `out-of-source`.
- If a DND item exists in the local CHM source but not in app data, mark it `missing`; do not fabricate implementation details.
- General web search may only help locate owner-provided source URLs or paths. It must not add or override DND rules data.

## Entry Manifest Source IDs

- `dnd-local-chm-primary`: primary DND local CHM extracted source at `C:\TRPG_CHM_WORK\extracted`.
- `dnd5echm-srd52-primary`: primary DND 2024 / SRD5.2 source from `https://github.com/DND5eChm/SRD5.2Chm`.
- `dnd5echm-main-5e-crosscheck`: broader DND5eChm cross-check source from `https://github.com/DND5eChm/DND5e_chm`.
- `dnd5echm-xgte`: XGtE entries under `DND5e_chm/珊娜萨的万事指南`.
- `dnd5echm-tcoe`: TCoE entries under `DND5e_chm/塔莎的万事坩埚`.
- Entry-level DND source manifest: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`.
- Spell effect text is referenced by source path only in the public manifest; future full effect text should be handled through publication-safe structured fields or a private/local import layer.

## Source: dnd-local-chm-primary

- System: DND
- Type: local-chm-extracted
- Local Path: `C:\TRPG_CHM_WORK\extracted`
- Version: owner-provided local CHM extraction
- Scope: DND 5e 2024 + Xanathar's Guide to Everything + Tasha's Cauldron of Everything, with visible adjacent reference directories such as DMG 2024 / Monster Manual 2025 / DNDBeyond retained for optional later audit.
- Allowed Use: primary source verification / coverage audit / manifest building / data correction planning
- Notes:
  - This is the primary authoritative source for DND coverage and correction.
  - GitHub DND5eChm / SRD5.2Chm entries are secondary cross-check only.
  - Official references are optional supplement only.
  - Do not use model memory, BG3, third-party wiki pages, or unspecified web sources to fill missing DND data.

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
