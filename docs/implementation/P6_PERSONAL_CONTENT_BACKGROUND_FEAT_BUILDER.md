# Personal Content Background and Feat Builder (P6.6)

## Purpose

P6.6 lets an authenticated user create private D&D background and feat entries
alongside the existing personal species form. The D&D creator can safely show
selected-pack backgrounds and Origin feats next to its built-in choices.

## Bounded Projection

The client adapter accepts only declared, non-executable fields:

- Background: name, summary, known skill names, tool names, and feature text.
- Feat: name, summary, category, and prerequisite text.

Unknown background skill names are dropped. A custom background cannot inject
an Origin feat. A custom feat never evaluates author-provided conditions or
effects; its prerequisite remains review text only.

## Builder Behavior

- Species, background, and Origin-feat selections remain tied to the selected
  immutable personal-pack version already recorded on the character.
- General feats may be stored as private content but are not added to the
  current origin-feat builder step.
- Selecting personal content does not grant Room admission or approval. The
  exact immutable version is still submitted and reviewed in the Room flow.

## Deferred

- Custom spell authoring and preparation UI.
- Class, subclass, item, and monster rule adapters.
- Executable effects, prerequisite automation, and rule calculations.
- Server-shared publication and Workshop distribution.
