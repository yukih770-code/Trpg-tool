# Server Content Set Resolution v1

This contract defines how a server chooses which versioned content entries are
available to **new** characters, campaigns, and authoring flows. It does not add
an editor, API, database mutation, permission model, or executable game rules.

## Principles

1. Source packs are immutable. Owner-provided/official content is never edited or
   physically deleted by a server.
2. A server ruleset version already pins `enabledPackVersionIds`. This contract
   layers small, entry-level choices on that frozen pack set.
3. A host can disable an entry for new work, or replace it with a different entry
   from an enabled private/imported pack version. A replacement is never an in-place
   mutation of the source entry.
4. A character/campaign/runtime snapshot retains its exact source references. Do
   not re-resolve old snapshots through a newly published content set.
5. Conflicting or missing policies are reported as unresolved. The resolver never
   guesses, falls back by display name, or silently enables an unbound pack.

## Data model

`ContentEntryRecord` identifies an immutable entry by `(packVersionId, entryId)`
and a publisher revision id. Custom entries must have their own ids and may carry a
`replaces` reference. `ServerContentSet` contains the existing enabled pack-version
ids plus `disabled` or `replacement` policies.

The durable database seam already exists in migration
`0009_remaining_platform_foundation.sql`: `compendium_packs`,
`compendium_pack_versions`, `compendium_entries`, and server/campaign pack bindings.
This contract creates no duplicate table and makes no migration.

## Follow-on slices

1. Persist/read a server ruleset draft payload that carries these entry policies.
2. Add a private draft editor for one narrow family (DND species/heritages, then
   subclasses) that publishes a new private pack version.
3. Project the resolved set into Creator catalogs and pin selected entry revisions
   on newly saved characters.
4. Add server-admin review/publish controls, then only later community publishing,
   browsing, copying, and moderation.

## Boundaries

This is not a legal-content importer, a DND rules engine, a client-side permission
check, or a general Workshop marketplace. Server role checks, persistence, source
licensing, and executable effects remain separate concerns.
