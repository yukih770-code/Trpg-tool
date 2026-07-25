/**
 * EntityGraph seed — normalizes the existing platform mock data into a single
 * authoritative node + edge set.
 *
 * AI-LANDMARK: ENTITY_GRAPH_SEED_V1
 *
 * This is the ONLY module that reads the legacy entity relation sources.
 * Public Workshop and Fan Plaza records are intentionally absent until those
 * surfaces receive real published content.
 *
 * No business logic, no UI — pure data normalization.
 */
import {
  DEFAULT_PAYLOAD_KIND,
  type EntityGraphSeed,
  type EntityNode,
  type EntityRelation,
  type EntityType,
  type RelationType,
} from './entityGraph';
import { ENTITY_RELATIONS, LINKABLE_ENTITIES } from '../platform/linkableEntityMockData';
import type { LinkableEntityType } from '../platform/linkableEntityTypes';

const LEGACY_TYPE_MAP: Record<LinkableEntityType, EntityType> = {
  actor: 'actor',
  campaign: 'campaign',
  sessionLog: 'sessionLog',
  map: 'map',
  workshopItem: 'workshopPackage',
  fanWork: 'fanWork',
  world: 'world',
  npc: 'npc',
  music: 'mediaAsset',
  handout: 'handout',
};

function buildSeed(): EntityGraphSeed {
  const nodeMap = new Map<string, EntityNode>();

  // 1) Linkable entities. Public workshop/fan sample records are excluded.
  for (const e of LINKABLE_ENTITIES) {
    if (e.type === 'workshopItem' || e.type === 'fanWork') continue;
    const type = LEGACY_TYPE_MAP[e.type];
    nodeMap.set(e.id, {
      id: e.id,
      type,
      title: e.title,
      subtitle: e.subtitle,
      summary: e.summary,
      visibility: e.visibility,
      status: 'published',
      schemaVersion: 1,
      ownerId: 'author-sample',
      tags: e.tags,
      payloadRef: { kind: DEFAULT_PAYLOAD_KIND[type] },
      shareCode: e.shareCode,
      publicPathLabel: e.publicPathLabel,
    });
  }

  // ── Edges ──────────────────────────────────────────────────────────────────
  const relations: EntityRelation[] = [];
  const seen = new Set<string>();

  const addRelation = (rel: EntityRelation): void => {
    const key = `${rel.sourceId}|${rel.targetId}|${rel.relationType}`;
    if (seen.has(key)) return;
    // Corrupt-object isolation: skip dangling edges.
    if (!nodeMap.has(rel.sourceId) || !nodeMap.has(rel.targetId)) return;
    seen.add(key);
    relations.push(rel);
  };

  // 2) Canonical legacy relations. Edges to unavailable public sample records
  // are discarded by the node-existence check below.
  for (const r of ENTITY_RELATIONS) {
    const src = nodeMap.get(r.sourceId);
    const tgt = nodeMap.get(r.targetId);
    if (!src || !tgt) continue;
    addRelation({
      id: r.id,
      sourceId: r.sourceId,
      sourceType: src.type,
      targetId: r.targetId,
      targetType: tgt.type,
      relationType: r.relationKind as RelationType,
      label: r.label,
    });
  }

  return { nodes: [...nodeMap.values()], relations };
}

export const ENTITY_GRAPH_SEED: EntityGraphSeed = buildSeed();
