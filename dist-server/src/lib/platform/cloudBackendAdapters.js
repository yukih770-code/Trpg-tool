/**
 * Cloud backend adapter boundary contracts (v0, types only).
 *
 * AI-LANDMARK: CLOUD_BACKEND_ADAPTER_BOUNDARY_CONTRACTS_V0
 *
 * These contracts describe identity, permission, object storage, and persistence
 * seams for a future cloud backend. They do not implement auth, database IO,
 * object storage IO, migrations, server protocol changes, RuntimeLog
 * persistence, or AI workflows.
 *
 * Vendor examples such as Supabase, Neon, R2, S3, Clerk, Redis, or NATS are
 * implementation choices behind adapters, not platform object boundaries.
 */
export {};
