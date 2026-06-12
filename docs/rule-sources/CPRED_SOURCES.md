# CP RED Rule Sources

## System Scope

- System: CP RED
- Scope: Cyberpunk RED Core

## Source Authority

- Authority: owner-provided source.
- Current owner-provided source: `cpred-core-preview-pdf`.
- Full Cyberpunk RED Core source scope requires owner confirmation if this preview PDF is insufficient for a target item.
- Until sufficient owner-provided CP RED source coverage is registered, do not use AI memory, third-party wiki pages, or general web search to expand CP RED rule data.
- Existing CP RED app data remains retained, but should be treated as `ai-assisted-unverified` unless it is matched to an owner-provided source.
- If existing CP RED app data conflicts with an owner-provided source, the owner-provided source wins.
- If an existing CP RED item cannot be found in owner-provided sources, mark it `out-of-source` or `needs-human-check`.
- If an owner-provided CP RED source contains an item missing from app data, mark it `missing`; do not fabricate implementation details.

## Source: cpred-core-github

- System: CP RED
- Type: github
- URL: TODO: paste owner-provided Cyberpunk RED Core GitHub source URL
- Version: TODO
- Scope: Cyberpunk RED Core source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting CP RED core data.

## Source: cpred-core-preview-pdf

- System: CP RED
- Type: pdf
- Local Path: `C:\Users\Acer\Desktop\TRPG辅助工具开发\规则书\CYBER PUNK RED\赛博朋克红-核心规则试阅-20260521.pdf`
- Version: TODO: confirm exact source version / preview date
- Scope: Cyberpunk RED Core preview source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: Owner-provided local PDF path. Treat extracted data as `needs-human-check` unless the source scope is confirmed as sufficient for the target item.

## Source: cpred-core-pdf

- System: CP RED
- Type: pdf
- Local Path: TODO: paste local Cyberpunk RED Core PDF path if separate from preview PDF
- Version: TODO
- Scope: Cyberpunk RED Core source verification
- Allowed Use: source verification / manifest building / data correction
- Notes: AI must cite this `sourceId` when extracting full CP RED core data.

## CP RED AI Rules

- CP RED role ability, skills, weapons, armor, cyberware, critical injury, market item, and netrunning data must trace to `sourceId`.
- Do not let AI fill complete equipment tables, cyberware tables, critical injury tables, market items, or Netrunning data from memory.
- If the listed source does not contain the item, mark `needs-human-check`; do not fill it from memory.
- Third-party wiki sources are forbidden unless explicitly added to this source manifest.
