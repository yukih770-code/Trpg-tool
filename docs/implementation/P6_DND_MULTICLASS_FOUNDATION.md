# P6 DND Multiclass Foundation

## Scope

Character saves now carry `classLevels`, a class-by-class allocation record.
Existing saves migrate their legacy `jobClass`, `subclass`, and total `level`
into one equivalent allocation. Single-class level-up continues to increment
that primary allocation.

## Boundary

- This is a storage and migration foundation, not a multiclass character
  builder yet.
- It does not calculate combined spell slots, pact magic, feature effects,
  prerequisites, starting proficiencies, HP rolls, or Room approval.
- `jobClass` and `subclass` remain the compatibility fields used by existing
  screens until a dedicated multiclass builder and rules resolver are ready.
- A future Room submission must carry a reviewed character snapshot; local
  class allocations do not grant shared-play authority.

## Follow-up

The next slice should introduce a reviewed class-allocation planner, followed
by independently verified DND multiclass calculations. It must not infer rules
from memory or merge unverified class data with Runtime execution.
