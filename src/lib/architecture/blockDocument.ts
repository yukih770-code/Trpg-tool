/**
 * BlockDocument Protocol — the platform's unified structured-content format.
 *
 * AI-LANDMARK: BLOCK_DOCUMENT_PROTOCOL_V1
 *
 * One content protocol shared by future: scenario chapters, rule summaries, NPC
 * profiles, map notes, session logs, character stories, fan works, Workshop
 * drafts, system reference pages, and AI drafts.
 *
 * Hard rules:
 *   - Content truth is a structured `ContentBlock[]`, NEVER an HTML string.
 *   - Blocks may REFERENCE entities, but only by `{ entityId, entityType }`.
 *     Titles/covers/summaries/payloads are NOT inlined; they resolve through the
 *     EntityGraph / Repository at render time.
 *   - Cross-object relation AUTHORITY stays in the EntityGraph. A document's
 *     entity-ref blocks PROJECT to EntityGraph edges (see projectDocumentRelations);
 *     `relatedEntityIds` on a document is a derived cache only.
 *   - Unknown/unimplemented block types degrade to a placeholder, never crash.
 *
 * This module is types + pure helpers only. No DB, no backend, no UI.
 */
import type {
  CreateRelationInput,
  EntityStatus,
  EntityType,
  EntityVisibility,
  RelationType,
} from './entityGraph';

export type BlockDocumentId = string;
export type ContentBlockId = string;

/** Reuse the canonical lifecycle/visibility enums (single source). */
export type BlockDocumentStatus = EntityStatus;
export type BlockDocumentVisibility = EntityVisibility;

/** A reference to another platform object. The ONLY thing a ref block stores. */
export type EntityRef = {
  entityId: string;
  entityType: EntityType;
};

// ─── Constrained inline marks (NOT HTML) ─────────────────────────────────────

export type InlineMarkType = 'bold' | 'italic' | 'code' | 'link';

export type InlineMark = {
  type: InlineMarkType;
  /** Character offsets into the run's `text`. */
  start: number;
  end: number;
  /** Display-only target for `link` marks (no fetch, no routing). */
  href?: string;
};

/** A plain-text run with a constrained, structured set of inline marks. */
export type RichText = {
  text: string;
  marks?: InlineMark[];
};

// ─── Block base ──────────────────────────────────────────────────────────────

export type HeadingLevel = 1 | 2 | 3;
export type CalloutTone = 'info' | 'note' | 'warning' | 'tip';

type BlockBase<TType extends string> = {
  id: ContentBlockId;
  type: TType;
};

// ── V1 blocks (must render) ──────────────────────────────────────────────────

export type TextBlock = BlockBase<'text'> & { text: RichText };
export type HeadingBlock = BlockBase<'heading'> & { level: HeadingLevel; text: string };
export type CalloutBlock = BlockBase<'callout'> & { tone: CalloutTone; text: RichText };
export type ImageBlock = BlockBase<'image'> & {
  /** References a MediaAsset by id — never inlined base64. */
  mediaAssetId: string;
  caption?: string;
  /** PreviewArt fallback kind while the media model (A6) is unimplemented. */
  placeholderKind?: string;
};
export type ImageGalleryBlock = BlockBase<'imageGallery'> & {
  mediaAssetIds: string[];
  caption?: string;
  placeholderKind?: string;
};
export type EntityMentionBlock = BlockBase<'entityMention'> & { ref: EntityRef; label?: string };
export type EntityCardBlock = BlockBase<'entityCard'> & { ref: EntityRef };

// ── Contract-only blocks (typed now, full render deferred) ───────────────────

export type AudioBlock = BlockBase<'audio'> & { mediaAssetId?: string; caption?: string };
export type ExternalLinkBlock = BlockBase<'externalLink'> & { url: string; label?: string };
export type DiceFormulaBlock = BlockBase<'diceFormula'> & { formula: string; label?: string };
export type StatBlockBlock = BlockBase<'statBlock'> & { ref?: EntityRef; entries?: Record<string, string> };
export type MapPreviewBlock = BlockBase<'mapPreview'> & { ref: EntityRef };
export type WorkshopReferenceBlock = BlockBase<'workshopReference'> & { ref: EntityRef };
export type FanWorkReferenceBlock = BlockBase<'fanWorkReference'> & { ref: EntityRef };
export type RuleReferenceBlock = BlockBase<'ruleReference'> & { ruleId: string; system?: string; label?: string };
export type TableBlock = BlockBase<'table'> & { rows: string[][]; caption?: string };

/** Forward-compat fallback: unknown serialized blocks normalize to this. */
export type UnknownBlock = BlockBase<'unknown'> & { rawType?: string };

export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | CalloutBlock
  | ImageBlock
  | ImageGalleryBlock
  | EntityMentionBlock
  | EntityCardBlock
  | AudioBlock
  | ExternalLinkBlock
  | DiceFormulaBlock
  | StatBlockBlock
  | MapPreviewBlock
  | WorkshopReferenceBlock
  | FanWorkReferenceBlock
  | RuleReferenceBlock
  | TableBlock
  | UnknownBlock;

export type ContentBlockType = ContentBlock['type'];

export const V1_BLOCK_TYPES: ContentBlockType[] = [
  'text', 'heading', 'callout', 'image', 'imageGallery', 'entityMention', 'entityCard',
];

export const CONTRACT_ONLY_BLOCK_TYPES: ContentBlockType[] = [
  'audio', 'externalLink', 'diceFormula', 'statBlock', 'mapPreview',
  'workshopReference', 'fanWorkReference', 'ruleReference', 'table',
];

// ─── Document ────────────────────────────────────────────────────────────────

export type BlockDocumentPayloadRef = {
  kind: 'inline' | 'external';
  /** Opaque ref when blocks live outside the document record (future). */
  ref?: string;
};

export type BlockDocument = {
  id: BlockDocumentId;
  schemaVersion: number;
  title: string;
  summary: string;
  ownerId?: string;
  visibility: BlockDocumentVisibility;
  status: BlockDocumentStatus;
  blocks: ContentBlock[];
  /**
   * Derived summary / cache ONLY — never the authority for relations. The
   * authoritative document↔entity edges live in the EntityGraph.
   */
  relatedEntityIds?: string[];
  payloadRef?: BlockDocumentPayloadRef;
  createdAt: string;
  updatedAt: string;
};

export type BlockDocumentCoverHint =
  | { kind: 'mediaAsset'; mediaAssetId: string }
  | { kind: 'entity'; ref: EntityRef }
  | { kind: 'none' };

export type BlockDocumentSummary = {
  id: BlockDocumentId;
  schemaVersion: number;
  title: string;
  summary: string;
  visibility: BlockDocumentVisibility;
  status: BlockDocumentStatus;
  /** Which block kinds the document contains (display tags). */
  blockTypeSummary: ContentBlockType[];
  cover: BlockDocumentCoverHint;
  ownerId?: string;
  updatedAt: string;
};

/** Detail = full block structure; media/entities are resolved lazily by callers. */
export type BlockDocumentDetail = BlockDocument;

// ─── Validation ──────────────────────────────────────────────────────────────

export type BlockDocumentValidationIssue = {
  blockId?: string;
  code:
    | 'unknown-block-type'
    | 'missing-entity-ref'
    | 'invalid-heading-level'
    | 'empty-text'
    | 'missing-media-ref';
  message: string;
};

export type BlockDocumentValidationResult = {
  ok: boolean;
  issues: BlockDocumentValidationIssue[];
};

// ─── Entity-reference → EntityGraph bridge ───────────────────────────────────

/**
 * Relation type used when a document's reference block is PROJECTED into the
 * EntityGraph. Uses existing A1 RelationTypes (no new 'references' member is
 * introduced this round — see protocol doc §7).
 */
export const BLOCK_REF_RELATION_TYPE: Partial<Record<ContentBlockType, RelationType>> = {
  entityMention: 'mentions',
  entityCard: 'mentions',
  mapPreview: 'uses',
  statBlock: 'uses',
  workshopReference: 'relatedTo',
  fanWorkReference: 'relatedTo',
};

/** Extract the EntityRef carried by a block, if any. */
export function blockEntityRef(block: ContentBlock): EntityRef | undefined {
  switch (block.type) {
    case 'entityMention':
    case 'entityCard':
    case 'mapPreview':
    case 'workshopReference':
    case 'fanWorkReference':
      return block.ref;
    case 'statBlock':
      return block.ref;
    default:
      return undefined;
  }
}

/** All distinct block kinds present (for summary tags). */
export function documentBlockTypes(doc: BlockDocument): ContentBlockType[] {
  return Array.from(new Set(doc.blocks.map((b) => b.type)));
}

/** Distinct MediaAsset ids referenced by image / gallery / audio blocks. */
export function documentMediaRefs(doc: BlockDocument): string[] {
  const seen = new Set<string>();
  for (const block of doc.blocks) {
    if (block.type === 'image' && block.mediaAssetId) seen.add(block.mediaAssetId);
    if (block.type === 'imageGallery') block.mediaAssetIds.forEach((id) => seen.add(id));
    if (block.type === 'audio' && block.mediaAssetId) seen.add(block.mediaAssetId);
  }
  return [...seen];
}

/** Distinct entity references the document carries (derived — not authority). */
export function documentEntityRefs(doc: BlockDocument): EntityRef[] {
  const seen = new Set<string>();
  const out: EntityRef[] = [];
  for (const block of doc.blocks) {
    const ref = blockEntityRef(block);
    if (ref && !seen.has(ref.entityId)) {
      seen.add(ref.entityId);
      out.push(ref);
    }
  }
  return out;
}

/**
 * Project a document's reference blocks into EntityGraph edges
 * (document node → referenced entity). The returned inputs are what a future
 * write path (A9) would feed to `EntityGraphRepository.createRelation`. The
 * EntityGraph remains the authority; this is the bridge, not a second store.
 */
export function projectDocumentRelations(doc: BlockDocument): CreateRelationInput[] {
  const out: CreateRelationInput[] = [];
  const seen = new Set<string>();
  for (const block of doc.blocks) {
    const ref = blockEntityRef(block);
    const relationType = BLOCK_REF_RELATION_TYPE[block.type];
    if (!ref || !relationType) continue;
    const key = `${ref.entityId}|${relationType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      sourceId: doc.id,
      sourceType: 'blockDocument',
      targetId: ref.entityId,
      targetType: ref.entityType,
      relationType,
      label: relationType,
    });
  }
  return out;
}

/** First image / cover hint for summaries. */
export function documentCoverHint(doc: BlockDocument): BlockDocumentCoverHint {
  for (const block of doc.blocks) {
    if (block.type === 'image') return { kind: 'mediaAsset', mediaAssetId: block.mediaAssetId };
    if (block.type === 'imageGallery' && block.mediaAssetIds[0]) {
      return { kind: 'mediaAsset', mediaAssetId: block.mediaAssetIds[0] };
    }
    if (block.type === 'entityCard') return { kind: 'entity', ref: block.ref };
  }
  return { kind: 'none' };
}

export function toBlockDocumentSummary(doc: BlockDocument): BlockDocumentSummary {
  return {
    id: doc.id,
    schemaVersion: doc.schemaVersion,
    title: doc.title,
    summary: doc.summary,
    visibility: doc.visibility,
    status: doc.status,
    blockTypeSummary: documentBlockTypes(doc),
    cover: documentCoverHint(doc),
    ownerId: doc.ownerId,
    updatedAt: doc.updatedAt,
  };
}

const KNOWN_BLOCK_TYPES = new Set<string>([...V1_BLOCK_TYPES, ...CONTRACT_ONLY_BLOCK_TYPES]);

/** Lightweight structural validation (no rendering, no side effects). */
export function validateBlockDocument(doc: BlockDocument): BlockDocumentValidationResult {
  const issues: BlockDocumentValidationIssue[] = [];
  for (const block of doc.blocks) {
    if (block.type === 'unknown' || !KNOWN_BLOCK_TYPES.has(block.type)) {
      issues.push({ blockId: block.id, code: 'unknown-block-type', message: `Unknown block type "${block.type}" — render as placeholder.` });
      continue;
    }
    if (block.type === 'heading' && (block.level < 1 || block.level > 3)) {
      issues.push({ blockId: block.id, code: 'invalid-heading-level', message: 'Heading level must be 1–3.' });
    }
    const ref = blockEntityRef(block);
    if ((block.type === 'entityMention' || block.type === 'entityCard' || block.type === 'mapPreview' ||
      block.type === 'workshopReference' || block.type === 'fanWorkReference') && (!ref || !ref.entityId || !ref.entityType)) {
      issues.push({ blockId: block.id, code: 'missing-entity-ref', message: 'Reference block missing entityId/entityType.' });
    }
    if (block.type === 'image' && !block.mediaAssetId) {
      issues.push({ blockId: block.id, code: 'missing-media-ref', message: 'Image block missing mediaAssetId.' });
    }
  }
  return { ok: issues.length === 0, issues };
}
