# P6 Personal Content Import

## Scope

Personal content authors can import a bounded JSON pack from **我的自定义资料**. The interface validates a small, declarative draft locally, previews its entry count and names, and then uses the existing private pack APIs to create either a new pack or a new immutable version of a selected pack.

## Boundary

- Import is private to the current authenticated user and never creates a World Server binding.
- Import does not alter official compendium data, create executable rules, or activate content in a Room.
- The browser preview is convenience validation only. The server independently validates entry kinds, payload shape, ownership, pack lifecycle, visibility, and version append rules.
- Selecting a saved pack imports a new version; older Room-referenced versions remain unchanged.

## Accepted shape

```json
{
  "displayName": "我的资料包",
  "versionLabel": "1.0.0",
  "metadata": { "gameSystemId": "dnd5e-2024" },
  "entries": [
    {
      "entryKind": "species",
      "displayName": "自定义种族",
      "content": {},
      "metadata": {}
    }
  ]
}
```

There must be 1-50 entries. Supported kinds are the existing private compendium kinds: species, species option, class, subclass, background, feat, spell, item, monster, rule, and other.

## Deferred

There is no bulk export, pack diff, collaborative editing, server-shared publication, rule execution, or automatic Room approval in this slice.
