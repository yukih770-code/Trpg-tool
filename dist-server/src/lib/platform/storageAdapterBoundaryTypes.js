/**
 * Storage adapter boundary contracts (v0, types only).
 *
 * AI-LANDMARK: STORAGE_ADAPTER_BOUNDARY_CONTRACTS_V0
 *
 * These are platform-level storage adapter boundary contracts for the portable
 * Room Server model. They describe storage domains, record references, operation
 * intents, capability summaries, and error shapes. They do not implement file
 * IO, database access, persistence, networking, serialization, or migrations.
 *
 * Boundary only: LAN / self-hosted / official deployments later implement this
 * via different adapters. The protocol must not bind to a specific database.
 * Platform-neutral (no DND/COC/CP RED rules); imports nothing.
 */
export {};
