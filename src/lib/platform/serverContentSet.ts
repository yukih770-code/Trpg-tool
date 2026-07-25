/**
 * Server content-set resolution contract (P6.CONTENT-SET-RESOLUTION).
 *
 * A World Server never mutates or deletes a source entry. It selects immutable
 * pack versions through ServerRulesetVersion.enabledPackVersionIds, then may
 * disable a particular entry for new work or replace it with a separately
 * versioned private entry. Existing characters/campaigns continue to pin their
 * original entry references.
 *
 * This module is intentionally pure: no React, persistence, browser APIs,
 * permissions, or rules execution. It is the narrow shared seam for future
 * Compendium authoring, Server Settings, and Creator catalog projections.
 */

export type ContentEntryKind =
  | 'species'
  | 'speciesOption'
  | 'class'
  | 'subclass'
  | 'background'
  | 'feat'
  | 'spell'
  | 'item'
  | 'monster'
  | 'rule'
  | 'other';

/** Where a published, immutable entry version originated. */
export type ContentEntrySourceKind =
  | 'ownerSource'
  | 'official'
  | 'private'
  | 'imported'
  | 'community';

/** A stable reference inside an immutable compendium pack version. */
export interface ContentEntryRef {
  packVersionId: string;
  entryId: string;
}

/**
 * A resolved catalog record. `entryId` is intentionally package-local: a
 * custom entry must use its own id and may only point at an entry it replaces.
 */
export interface ContentEntryRecord extends ContentEntryRef {
  kind: ContentEntryKind;
  displayName: string;
  sourceKind: ContentEntrySourceKind;
  /** Immutable revision identifier supplied by the pack publisher. */
  revisionId: string;
  /** Optional source entry this private/imported entry is meant to replace. */
  replaces?: ContentEntryRef;
}

export type ServerContentEntryPolicy =
  | {
      status: 'disabled';
      target: ContentEntryRef;
      /** Product-facing explanation, never a rules verdict. */
      note?: string;
    }
  | {
      status: 'replacement';
      target: ContentEntryRef;
      /** A separately versioned entry; source content is left untouched. */
      replacement: ContentEntryRef;
      note?: string;
    };

/**
 * Entry-level choices layered on the already-versioned enabled pack list.
 * It belongs in a future server ruleset draft/version payload, rather than in
 * any source pack or character record.
 */
export interface ServerContentSet {
  enabledPackVersionIds: string[];
  entryPolicies: ServerContentEntryPolicy[];
}

export interface ResolvedContentEntry {
  entry: ContentEntryRecord;
  /** The original source entry if this is a server-selected replacement. */
  replaces?: ContentEntryRef;
  provenance: 'source' | 'serverReplacement';
}

export interface ContentSetResolution {
  entries: ResolvedContentEntry[];
  /** Policies that could not be applied without guessing. */
  unresolvedPolicies: ServerContentEntryPolicy[];
}

export function contentEntryRefKey(ref: ContentEntryRef): string {
  return `${ref.packVersionId}:${ref.entryId}`;
}

function dedupePackVersionIds(ids: readonly string[]): Set<string> {
  return new Set(ids.filter((id) => id.trim().length > 0));
}

/**
 * Builds the catalog visible to new server work. Disabled source entries are
 * omitted. Replacements appear only when their own immutable pack version is
 * enabled. Existing snapshots should never be re-resolved with this helper.
 */
export function resolveServerContentSet(
  catalog: readonly ContentEntryRecord[],
  contentSet: ServerContentSet,
): ContentSetResolution {
  const enabledPackVersionIds = dedupePackVersionIds(contentSet.enabledPackVersionIds);
  const enabledEntries = catalog.filter((entry) => enabledPackVersionIds.has(entry.packVersionId));
  const entryByRef = new Map(enabledEntries.map((entry) => [contentEntryRefKey(entry), entry]));
  const policiesByTarget = new Map<string, ServerContentEntryPolicy>();
  const unresolvedPolicies: ServerContentEntryPolicy[] = [];

  for (const policy of contentSet.entryPolicies) {
    const targetKey = contentEntryRefKey(policy.target);
    if (!entryByRef.has(targetKey) || policiesByTarget.has(targetKey)) {
      unresolvedPolicies.push(policy);
      continue;
    }
    if (policy.status === 'replacement' && !entryByRef.has(contentEntryRefKey(policy.replacement))) {
      unresolvedPolicies.push(policy);
      continue;
    }
    policiesByTarget.set(targetKey, policy);
  }

  const entries: ResolvedContentEntry[] = [];
  const replacementKeys = new Set(
    [...policiesByTarget.values()]
      .filter((policy): policy is Extract<ServerContentEntryPolicy, { status: 'replacement' }> => policy.status === 'replacement')
      .map((policy) => contentEntryRefKey(policy.replacement)),
  );

  for (const entry of enabledEntries) {
    const entryKey = contentEntryRefKey(entry);
    if (replacementKeys.has(entryKey)) continue;

    const policy = policiesByTarget.get(entryKey);
    if (policy?.status === 'disabled') continue;
    if (policy?.status === 'replacement') {
      const replacement = entryByRef.get(contentEntryRefKey(policy.replacement));
      if (replacement) {
        entries.push({ entry: replacement, replaces: policy.target, provenance: 'serverReplacement' });
      }
      continue;
    }
    entries.push({ entry, provenance: 'source' });
  }

  return { entries, unresolvedPolicies };
}

/** True only for a reference that is actually present in this frozen result. */
export function isContentEntryResolved(
  resolution: Pick<ContentSetResolution, 'entries'>,
  ref: ContentEntryRef,
): boolean {
  return resolution.entries.some((resolved) =>
    resolved.entry.packVersionId === ref.packVersionId && resolved.entry.entryId === ref.entryId,
  );
}
