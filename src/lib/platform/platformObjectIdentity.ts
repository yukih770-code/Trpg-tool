export type PlatformObjectKind =
  | 'campaign'
  | 'actor'
  | 'user'
  | 'map'
  | 'handout'
  | 'mediaAsset'
  | 'libraryAsset'
  | 'communityWork'
  | 'workshopPackage'
  | 'collection'
  | 'shareableObject'
  | 'runtimeSession';

const PUBLIC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUBLIC_CODE_LENGTH = 8;
const PUBLIC_CODE_MAX_ATTEMPTS = 50;

const PUBLIC_CODE_PREFIXES: Record<PlatformObjectKind, string> = {
  campaign: 'CMP',
  actor: 'ACT',
  user: 'USR',
  map: 'MAP',
  handout: 'HND',
  mediaAsset: 'MED',
  libraryAsset: 'AST',
  communityWork: 'WRK',
  workshopPackage: 'WSP',
  collection: 'COL',
  shareableObject: 'SHR',
  runtimeSession: 'SES',
};

const INTERNAL_ID_PREFIXES: Record<PlatformObjectKind, string> = {
  campaign: 'campaign',
  actor: 'actor',
  user: 'user',
  map: 'map',
  handout: 'handout',
  mediaAsset: 'media_asset',
  libraryAsset: 'library_asset',
  communityWork: 'community_work',
  workshopPackage: 'workshop_package',
  collection: 'collection',
  shareableObject: 'shareable_object',
  runtimeSession: 'runtime_session',
};

export function generateInternalId(kind: PlatformObjectKind): string {
  const prefix = INTERNAL_ID_PREFIXES[kind];
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Identity Factory (P5.1) ──────────────────────────────────────────────────
// AI-LANDMARK: PLATFORM_IDENTITY_FACTORY_V1
//
// The ONE centralized identity authority. New code must mint platform object
// ids through these creators (all delegate to generateInternalId — no second
// generation path exists). Existing ids in stores remain valid: the factory is
// additive and no migration is performed in P5.1.
//
// Naming map (P5 roadmap → existing PlatformObjectKind):
//   User → 'user' · Character → 'actor' · Campaign → 'campaign'
//   Package → 'workshopPackage' · Runtime → 'runtimeSession'
//   Artifact → 'mediaAsset'

export const identityFactory = {
  createUserId: (): string => generateInternalId('user'),
  createActorId: (): string => generateInternalId('actor'),
  createCampaignId: (): string => generateInternalId('campaign'),
  createPackageId: (): string => generateInternalId('workshopPackage'),
  createRuntimeSessionId: (): string => generateInternalId('runtimeSession'),
  createArtifactId: (): string => generateInternalId('mediaAsset'),
  /** Generic escape hatch for the remaining PlatformObjectKind values. */
  createId: (kind: PlatformObjectKind): string => generateInternalId(kind),
} as const;

export type IdentityFactory = typeof identityFactory;

export function generatePublicCode(
  kind: PlatformObjectKind,
  existingCodes: Iterable<string> = [],
): string {
  const normalizedExistingCodes = new Set(
    [...existingCodes]
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean),
  );

  for (let attempt = 0; attempt < PUBLIC_CODE_MAX_ATTEMPTS; attempt += 1) {
    const code = `${getPublicCodePrefix(kind)}-${randomPublicCodeBody()}`;
    if (!normalizedExistingCodes.has(code)) return code;
  }

  throw new Error(`Unable to generate unique public code for ${kind}.`);
}

export function getPublicCodePrefix(kind: PlatformObjectKind): string {
  return PUBLIC_CODE_PREFIXES[kind];
}

export function isValidPublicCode(value: string): boolean {
  const normalizedValue = value.trim().toUpperCase();
  const prefixPattern = Object.values(PUBLIC_CODE_PREFIXES).join('|');
  return new RegExp(`^(${prefixPattern})-[${PUBLIC_CODE_ALPHABET}]{${PUBLIC_CODE_LENGTH}}$`).test(normalizedValue);
}

function randomPublicCodeBody(): string {
  let code = '';
  const values = getRandomValues(PUBLIC_CODE_LENGTH);
  for (const value of values) {
    code += PUBLIC_CODE_ALPHABET[value % PUBLIC_CODE_ALPHABET.length];
  }
  return code;
}

function getRandomValues(length: number): number[] {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return [...values];
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 256));
}
