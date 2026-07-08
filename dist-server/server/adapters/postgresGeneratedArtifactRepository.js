import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';
function toIso(value) {
    if (!value)
        return undefined;
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
function toPayload(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function toOptionalNumber(value) {
    if (value === null || value === undefined)
        return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
}
function rowToArtifact(row) {
    return {
        artifactId: row.artifact_id,
        ownerId: row.owner_id,
        campaignId: row.campaign_id ?? undefined,
        runtimeSessionId: row.runtime_session_id ?? undefined,
        runtimeEventId: row.runtime_event_id ?? undefined,
        artifactKind: row.artifact_kind,
        title: row.title,
        summary: row.summary ?? undefined,
        contentFormat: row.content_format,
        visibilityScope: row.visibility_scope,
        payload: toPayload(row.artifact_payload),
        sourcePayload: toPayload(row.source_payload),
        modelPayload: toPayload(row.model_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToMemory(row) {
    return {
        memoryEntryId: row.memory_entry_id,
        ownerId: row.owner_id,
        campaignId: row.campaign_id ?? undefined,
        runtimeSessionId: row.runtime_session_id ?? undefined,
        sourceArtifactId: row.source_artifact_id ?? undefined,
        memoryKind: row.memory_kind,
        memoryScope: row.memory_scope,
        title: row.title ?? undefined,
        contentText: row.content_text,
        visibilityScope: row.visibility_scope,
        payload: toPayload(row.memory_payload),
        sourcePayload: toPayload(row.source_payload),
        confidence: toOptionalNumber(row.confidence),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToContextSource(row) {
    return {
        contextSourceId: row.context_source_id,
        ownerId: row.owner_id,
        campaignId: row.campaign_id ?? undefined,
        artifactId: row.artifact_id ?? undefined,
        memoryEntryId: row.memory_entry_id ?? undefined,
        sourceKind: row.source_kind,
        sourceRefId: row.source_ref_id ?? undefined,
        sourcePayload: toPayload(row.source_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
    };
}
function mapRepositoryError(error) {
    if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
        return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
    }
    if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Generated artifact repository table is missing.' } };
    }
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
        return { ok: false, error: { kind: 'conflict', message: 'Generated artifact row already exists.' } };
    }
    if (code === '23503') {
        return { ok: false, error: { kind: 'conflict', message: 'Generated artifact references a missing owner/campaign/runtime/artifact/memory row.' } };
    }
    if (code === '42P01') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Generated artifact repository table is missing.' } };
    }
    const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
    return { ok: false, error: { kind: 'database_error', message: 'Generated artifact repository query failed.', retryable } };
}
const ARTIFACT_COLUMNS = `
  artifact_id, owner_id, campaign_id, runtime_session_id, runtime_event_id,
  artifact_kind, title, summary, content_format, visibility_scope,
  artifact_payload, source_payload, model_payload, schema_version,
  created_at, updated_at, archived_at
`;
const MEMORY_COLUMNS = `
  memory_entry_id, owner_id, campaign_id, runtime_session_id, source_artifact_id,
  memory_kind, memory_scope, title, content_text, visibility_scope,
  memory_payload, source_payload, confidence, schema_version,
  created_at, updated_at, archived_at
`;
const CONTEXT_SOURCE_COLUMNS = `
  context_source_id, owner_id, campaign_id, artifact_id, memory_entry_id,
  source_kind, source_ref_id, source_payload, schema_version, created_at
`;
const defaultExecutor = {
    query: (text, values) => queryPostgres(text, values),
};
export function createPostgresGeneratedArtifactRepository(executor = defaultExecutor, _options = {}) {
    // ── Generated artifacts ──────────────────────────────────────────────────
    async function getGeneratedArtifactById(artifactId) {
        try {
            const result = await executor.query(`SELECT ${ARTIFACT_COLUMNS} FROM generated_artifacts WHERE artifact_id = $1 LIMIT 1`, [artifactId]);
            return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    function listArtifactsWhere(column, value, options) {
        const conditions = [`${column} = $1`];
        const values = [value];
        if (options.artifactKind) {
            values.push(options.artifactKind);
            conditions.push(`artifact_kind = $${values.length}`);
        }
        if (options.visibilityScope) {
            values.push(options.visibilityScope);
            conditions.push(`visibility_scope = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
        values.push(limit);
        return executor.query(`SELECT ${ARTIFACT_COLUMNS} FROM generated_artifacts
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${values.length}`, values);
    }
    async function listGeneratedArtifactsByOwner(ownerId, options = {}) {
        try {
            const result = await listArtifactsWhere('owner_id', ownerId, options);
            return { ok: true, value: result.rows.map(rowToArtifact) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listGeneratedArtifactsByCampaign(campaignId, options = {}) {
        try {
            const result = await listArtifactsWhere('campaign_id', campaignId, options);
            return { ok: true, value: result.rows.map(rowToArtifact) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listGeneratedArtifactsByRuntimeSession(runtimeSessionId, options = {}) {
        try {
            const result = await listArtifactsWhere('runtime_session_id', runtimeSessionId, options);
            return { ok: true, value: result.rows.map(rowToArtifact) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createGeneratedArtifact(input) {
        const now = new Date().toISOString();
        const record = {
            artifactId: input.artifactId,
            ownerId: input.ownerId,
            campaignId: input.campaignId,
            runtimeSessionId: input.runtimeSessionId,
            runtimeEventId: input.runtimeEventId,
            artifactKind: input.artifactKind,
            title: input.title,
            summary: input.summary,
            contentFormat: input.contentFormat ?? 'json',
            visibilityScope: input.visibilityScope ?? 'user_private',
            payload: input.payload ?? {},
            sourcePayload: input.sourcePayload ?? {},
            modelPayload: input.modelPayload ?? {},
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await executor.query(`
          INSERT INTO generated_artifacts (
            artifact_id, owner_id, campaign_id, runtime_session_id, runtime_event_id,
            artifact_kind, title, summary, content_format, visibility_scope,
            artifact_payload, source_payload, model_payload, schema_version,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $15)
        `, [
                record.artifactId,
                record.ownerId,
                record.campaignId ?? null,
                record.runtimeSessionId ?? null,
                record.runtimeEventId ?? null,
                record.artifactKind,
                record.title,
                record.summary ?? null,
                record.contentFormat,
                record.visibilityScope,
                JSON.stringify(record.payload),
                JSON.stringify(record.sourcePayload),
                JSON.stringify(record.modelPayload),
                record.schemaVersion,
                now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function updateGeneratedArtifact(input) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE generated_artifacts SET
            title = COALESCE($2, title),
            summary = COALESCE($3, summary),
            content_format = COALESCE($4, content_format),
            visibility_scope = COALESCE($5, visibility_scope),
            artifact_payload = COALESCE($6::jsonb, artifact_payload),
            source_payload = COALESCE($7::jsonb, source_payload),
            model_payload = COALESCE($8::jsonb, model_payload),
            updated_at = $9
          WHERE artifact_id = $1
          RETURNING ${ARTIFACT_COLUMNS}
        `, [
                input.artifactId,
                input.title ?? null,
                input.summary ?? null,
                input.contentFormat ?? null,
                input.visibilityScope ?? null,
                input.payload === undefined ? null : JSON.stringify(input.payload),
                input.sourcePayload === undefined ? null : JSON.stringify(input.sourcePayload),
                input.modelPayload === undefined ? null : JSON.stringify(input.modelPayload),
                now,
            ]);
            return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function archiveGeneratedArtifact(artifactId, archivedAt) {
        const at = archivedAt ?? new Date().toISOString();
        try {
            const result = await executor.query(`UPDATE generated_artifacts SET archived_at = $2, updated_at = $2 WHERE artifact_id = $1 RETURNING ${ARTIFACT_COLUMNS}`, [artifactId, at]);
            return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function restoreGeneratedArtifact(artifactId) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`UPDATE generated_artifacts SET archived_at = NULL, updated_at = $2 WHERE artifact_id = $1 RETURNING ${ARTIFACT_COLUMNS}`, [artifactId, now]);
            return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    // ── AI memory entries ────────────────────────────────────────────────────
    async function getAiMemoryEntryById(memoryEntryId) {
        try {
            const result = await executor.query(`SELECT ${MEMORY_COLUMNS} FROM ai_memory_entries WHERE memory_entry_id = $1 LIMIT 1`, [memoryEntryId]);
            return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    function listMemoryWhere(column, value, options) {
        const conditions = [`${column} = $1`];
        const values = [value];
        if (options.memoryKind) {
            values.push(options.memoryKind);
            conditions.push(`memory_kind = $${values.length}`);
        }
        if (options.memoryScope) {
            values.push(options.memoryScope);
            conditions.push(`memory_scope = $${values.length}`);
        }
        if (options.visibilityScope) {
            values.push(options.visibilityScope);
            conditions.push(`visibility_scope = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
        values.push(limit);
        return executor.query(`SELECT ${MEMORY_COLUMNS} FROM ai_memory_entries
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${values.length}`, values);
    }
    async function listAiMemoryEntriesByOwner(ownerId, options = {}) {
        try {
            const result = await listMemoryWhere('owner_id', ownerId, options);
            return { ok: true, value: result.rows.map(rowToMemory) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listAiMemoryEntriesByCampaign(campaignId, options = {}) {
        try {
            const result = await listMemoryWhere('campaign_id', campaignId, options);
            return { ok: true, value: result.rows.map(rowToMemory) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listAiMemoryEntriesByRuntimeSession(runtimeSessionId, options = {}) {
        try {
            const result = await listMemoryWhere('runtime_session_id', runtimeSessionId, options);
            return { ok: true, value: result.rows.map(rowToMemory) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createAiMemoryEntry(input) {
        const now = new Date().toISOString();
        const record = {
            memoryEntryId: input.memoryEntryId,
            ownerId: input.ownerId,
            campaignId: input.campaignId,
            runtimeSessionId: input.runtimeSessionId,
            sourceArtifactId: input.sourceArtifactId,
            memoryKind: input.memoryKind,
            memoryScope: input.memoryScope ?? 'campaign',
            title: input.title,
            contentText: input.contentText,
            visibilityScope: input.visibilityScope ?? 'campaign',
            payload: input.payload ?? {},
            sourcePayload: input.sourcePayload ?? {},
            confidence: input.confidence,
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await executor.query(`
          INSERT INTO ai_memory_entries (
            memory_entry_id, owner_id, campaign_id, runtime_session_id, source_artifact_id,
            memory_kind, memory_scope, title, content_text, visibility_scope,
            memory_payload, source_payload, confidence, schema_version,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, $15)
        `, [
                record.memoryEntryId,
                record.ownerId,
                record.campaignId ?? null,
                record.runtimeSessionId ?? null,
                record.sourceArtifactId ?? null,
                record.memoryKind,
                record.memoryScope,
                record.title ?? null,
                record.contentText,
                record.visibilityScope,
                JSON.stringify(record.payload),
                JSON.stringify(record.sourcePayload),
                record.confidence ?? null,
                record.schemaVersion,
                now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function updateAiMemoryEntry(input) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE ai_memory_entries SET
            title = COALESCE($2, title),
            content_text = COALESCE($3, content_text),
            memory_scope = COALESCE($4, memory_scope),
            visibility_scope = COALESCE($5, visibility_scope),
            memory_payload = COALESCE($6::jsonb, memory_payload),
            source_payload = COALESCE($7::jsonb, source_payload),
            confidence = COALESCE($8, confidence),
            updated_at = $9
          WHERE memory_entry_id = $1
          RETURNING ${MEMORY_COLUMNS}
        `, [
                input.memoryEntryId,
                input.title ?? null,
                input.contentText ?? null,
                input.memoryScope ?? null,
                input.visibilityScope ?? null,
                input.payload === undefined ? null : JSON.stringify(input.payload),
                input.sourcePayload === undefined ? null : JSON.stringify(input.sourcePayload),
                input.confidence ?? null,
                now,
            ]);
            return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function archiveAiMemoryEntry(memoryEntryId, archivedAt) {
        const at = archivedAt ?? new Date().toISOString();
        try {
            const result = await executor.query(`UPDATE ai_memory_entries SET archived_at = $2, updated_at = $2 WHERE memory_entry_id = $1 RETURNING ${MEMORY_COLUMNS}`, [memoryEntryId, at]);
            return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function restoreAiMemoryEntry(memoryEntryId) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`UPDATE ai_memory_entries SET archived_at = NULL, updated_at = $2 WHERE memory_entry_id = $1 RETURNING ${MEMORY_COLUMNS}`, [memoryEntryId, now]);
            return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    // ── Context sources (append-only) ─────────────────────────────────────────
    async function getAiContextSourceById(contextSourceId) {
        try {
            const result = await executor.query(`SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE context_source_id = $1 LIMIT 1`, [contextSourceId]);
            return { ok: true, value: result.rows[0] ? rowToContextSource(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listAiContextSourcesForArtifact(artifactId) {
        try {
            const result = await executor.query(`SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE artifact_id = $1 ORDER BY created_at ASC LIMIT 500`, [artifactId]);
            return { ok: true, value: result.rows.map(rowToContextSource) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listAiContextSourcesForMemoryEntry(memoryEntryId) {
        try {
            const result = await executor.query(`SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE memory_entry_id = $1 ORDER BY created_at ASC LIMIT 500`, [memoryEntryId]);
            return { ok: true, value: result.rows.map(rowToContextSource) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createAiContextSource(input) {
        const now = new Date().toISOString();
        const record = {
            contextSourceId: input.contextSourceId,
            ownerId: input.ownerId,
            campaignId: input.campaignId,
            artifactId: input.artifactId,
            memoryEntryId: input.memoryEntryId,
            sourceKind: input.sourceKind,
            sourceRefId: input.sourceRefId,
            sourcePayload: input.sourcePayload ?? {},
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
        };
        try {
            await executor.query(`
          INSERT INTO ai_context_sources (
            context_source_id, owner_id, campaign_id, artifact_id, memory_entry_id,
            source_kind, source_ref_id, source_payload, schema_version, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
        `, [
                record.contextSourceId,
                record.ownerId,
                record.campaignId ?? null,
                record.artifactId ?? null,
                record.memoryEntryId ?? null,
                record.sourceKind,
                record.sourceRefId ?? null,
                JSON.stringify(record.sourcePayload),
                record.schemaVersion,
                now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function checkReadiness() {
        try {
            const result = await executor.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('generated_artifacts', 'ai_memory_entries', 'ai_context_sources')
        `);
            const names = new Set(result.rows.map((row) => row.table_name));
            return {
                ok: true,
                value: {
                    generatedArtifactsTable: names.has('generated_artifacts'),
                    aiMemoryEntriesTable: names.has('ai_memory_entries'),
                    aiContextSourcesTable: names.has('ai_context_sources'),
                },
            };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    return {
        getGeneratedArtifactById,
        listGeneratedArtifactsByOwner,
        listGeneratedArtifactsByCampaign,
        listGeneratedArtifactsByRuntimeSession,
        createGeneratedArtifact,
        updateGeneratedArtifact,
        archiveGeneratedArtifact,
        restoreGeneratedArtifact,
        getAiMemoryEntryById,
        listAiMemoryEntriesByOwner,
        listAiMemoryEntriesByCampaign,
        listAiMemoryEntriesByRuntimeSession,
        createAiMemoryEntry,
        updateAiMemoryEntry,
        archiveAiMemoryEntry,
        restoreAiMemoryEntry,
        getAiContextSourceById,
        listAiContextSourcesForArtifact,
        listAiContextSourcesForMemoryEntry,
        createAiContextSource,
        checkReadiness,
    };
}
const defaultPostgresGeneratedArtifactRepository = createPostgresGeneratedArtifactRepository();
export async function getGeneratedArtifactById(artifactId) {
    return defaultPostgresGeneratedArtifactRepository.getGeneratedArtifactById(artifactId);
}
export async function getAiMemoryEntryById(memoryEntryId) {
    return defaultPostgresGeneratedArtifactRepository.getAiMemoryEntryById(memoryEntryId);
}
export async function getAiContextSourceById(contextSourceId) {
    return defaultPostgresGeneratedArtifactRepository.getAiContextSourceById(contextSourceId);
}
export async function checkPostgresGeneratedArtifactRepositoryReadiness() {
    return defaultPostgresGeneratedArtifactRepository.checkReadiness();
}
