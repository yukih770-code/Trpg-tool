# P6 Personal Content Workbench Inspection

## Purpose

Workshop's private `我的创作` workbench lists saved personal packs as managed
records, rather than treating them as anonymous form targets.

## Behavior

- The author can read the latest owner-private version and see its entry names
  and kinds.
- A pack can be selected as the base for a **new** immutable version.
- Published versions remain read-only. This slice does not add in-place editing,
  deletion, public sharing, or server adoption.

## Boundary

The inspection call uses the existing owner-only version endpoint. It neither
exports private bodies to another user nor sends entry contents to a Room.
