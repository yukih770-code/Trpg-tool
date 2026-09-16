# Size materialization acceptance evidence

See the [24-section implementation report](../DND_ACTOR_SIZE_FOOTPRINT_MATERIALIZATION_V1.md) for source provenance, scope, limitations, and A–V answers.

- browser-results.json: actual product walkthrough and IDs.
- actor-size-authority.json: accepted PC Medium, Campaign override Small, NPC Large.
- initial-map-events.json: server-materialized PC1×1 and NPC2×2 without numeric bounds.
- adjacent-attack.json: authoritative dagger result.
- range-rejection.json and rejection-no-mutation.json: 409 rejection and unchanged RuntimeLog.
- restored-map-events.json / restored-runtime-log.json: recovered durable streams.
- restart-health.json: final 11/11 schema readiness and recovery counts.
- verification-results.json / build-results.json: exact successful commands and output.
- source-changes.json / git-status.txt / git-diff-stat.txt: explicit review scope and preserved unrelated dirt.
- PNGs: actual Chrome captures; no generated mockups. Final view is 13-final-restart-override-rejection.png.

The configured database on port55453 was unavailable. The acceptance harness tests/size-materialization/local-infrastructure.mjs uses a fresh temporary PostgreSQL18 cluster on55459 and built backend8787. Run it interactively; stdin restart restarts only the backend against the same database; stop ends the fixture. It provisions existing migrations only, and leaves .env/existing databases untouched. Do not use its temporary acceptance records as production data.
