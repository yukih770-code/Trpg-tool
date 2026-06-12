# COC Rule Sources

## System Scope

- System: COC
- Scope: Call of Cthulhu 7e

## Source Authority

- Authority: owner-provided source pending.
- Until an owner-provided COC GitHub or PDF source is registered, do not use AI memory, third-party wiki pages, or general web search to expand COC rule data.
- Existing COC app data remains retained, but should be treated as `ai-assisted-unverified` unless it is later matched to an owner-provided source.
- If an existing COC item cannot be found in owner-provided sources after registration, mark it `out-of-source` or `needs-human-check`.
- If an owner-provided COC source contains an item missing from app data, mark it `missing`; do not fabricate implementation details.

## Source: coc7-quickstart-github

- System: COC
- Type: github
- URL: TODO: paste owner-provided Call of Cthulhu 7e Quickstart GitHub source URL
- Version: TODO
- Scope: Call of Cthulhu 7e quickstart-scope source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting COC quickstart-scope data.

## Source: coc7-quickstart-pdf

- System: COC
- Type: pdf
- Local Path: TODO: paste local Call of Cthulhu 7e Quickstart PDF path
- Version: TODO
- Scope: Call of Cthulhu 7e quickstart-scope source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting COC quickstart-scope data.

## Source: coc7-core-github

- System: COC
- Type: github
- URL: TODO: paste owner-provided Call of Cthulhu 7e core GitHub source URL
- Version: TODO
- Scope: Call of Cthulhu 7e core source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: Full COC 7e rules data must cite this `sourceId` or be marked `needs-human-check`.

## Source: coc7-core-pdf

- System: COC
- Type: pdf
- Local Path: TODO: paste local Call of Cthulhu 7e core PDF path
- Version: TODO
- Scope: Call of Cthulhu 7e core source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: Full COC 7e rules data must cite this `sourceId` or be marked `needs-human-check`.

## COC AI Rules

- COC skills, occupations, growth, SAN, and combat rules must trace to `sourceId`.
- If data is only verified from Quickstart, mark it `quickstart-scope`.
- If full rules require manual confirmation, mark `needs-human-check`.
- Do not use model memory to fill occupation lists, skill base values, SAN procedures, madness tables, or combat workflows.
- Third-party wiki sources are forbidden unless explicitly added to this source manifest.
