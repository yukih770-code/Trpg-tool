import type { createPostgresPlatformFoundationRepository } from '../adapters/postgresPlatformFoundationRepository.js';
import type { RoomPersonalContentReferenceSummary } from '../../src/lib/platform/roomTypes.js';

type CompendiumRepository = Pick<
  ReturnType<typeof createPostgresPlatformFoundationRepository>,
  'getCompendiumPackById' | 'getCompendiumPackVersionById'
>;

type RawReference = { packId?: unknown; packVersionId?: unknown };

export type PersonalContentReferenceResolution =
  | { ok: true; references: RoomPersonalContentReferenceSummary[] }
  | { ok: false; code: 'invalid' | 'not_found' | 'unavailable'; message: string };

const id = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160
  ? value.trim()
  : undefined;

/**
 * The room receives only a stable name/version reference. It does not receive
 * private pack entries, ownership IDs, or a live link to the author's editor.
 */
export async function resolveOwnedPersonalContentReferences(
  repository: CompendiumRepository,
  input: { viewerUserId: string; references?: unknown },
): Promise<PersonalContentReferenceResolution> {
  if (input.references === undefined) return { ok: true, references: [] };
  if (!Array.isArray(input.references) || input.references.length > 3) {
    return { ok: false, code: 'invalid', message: 'Personal content references must contain at most three items.' };
  }

  const references: RoomPersonalContentReferenceSummary[] = [];
  const seenVersions = new Set<string>();
  for (const raw of input.references) {
    const candidate = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as RawReference : {};
    const packId = id(candidate.packId);
    const packVersionId = id(candidate.packVersionId);
    if (!packId || !packVersionId || seenVersions.has(packVersionId)) {
      return { ok: false, code: 'invalid', message: 'Each personal content reference must identify a distinct pack version.' };
    }
    seenVersions.add(packVersionId);
    const [packResult, versionResult] = await Promise.all([
      repository.getCompendiumPackById(packId),
      repository.getCompendiumPackVersionById(packVersionId),
    ]);
    if (packResult.ok === false || versionResult.ok === false) {
      return { ok: false, code: 'unavailable', message: 'Personal content service is unavailable.' };
    }
    const pack = packResult.value;
    const version = versionResult.value;
    // Keep all unavailable cases alike so the endpoint cannot enumerate packs.
    if (!pack || !version || pack.archivedAt || version.archivedAt || pack.ownerId !== input.viewerUserId
      || pack.worldServerId || pack.visibilityScope !== 'user_private' || pack.lifecycleStatus !== 'published'
      || version.packId !== pack.packId) {
      return { ok: false, code: 'not_found', message: 'Selected personal content is unavailable.' };
    }
    references.push({ packId: pack.packId, packVersionId: version.packVersionId, displayName: pack.displayName, versionLabel: version.versionLabel, contentKind: 'personalCompendiumPack' });
  }
  return { ok: true, references };
}
