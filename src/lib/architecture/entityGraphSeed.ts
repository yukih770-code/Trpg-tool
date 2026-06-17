/**
 * EntityGraph seed — normalizes the existing platform mock data into a single
 * authoritative node + edge set.
 *
 * AI-LANDMARK: ENTITY_GRAPH_SEED_V1
 *
 * This is the ONLY module that reads the legacy mock relation sources
 * (LINKABLE_ENTITIES / ENTITY_RELATIONS / FAN_WORKS relations / workshop↔fanwork
 * maps). Everything else queries the graph through an EntityGraphRepository.
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
import { FAN_WORKS, RELATED_FAN_WORKS_BY_WORKSHOP } from '../platform/communityMockData';
import { WORKSHOP_BROWSE_SAMPLES } from '../platform/workshopTypes';

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

  // 1) Linkable entities (actors / campaigns / maps / logs / world / workshop / etc.)
  for (const e of LINKABLE_ENTITIES) {
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

  // 2) Fan works (override/extend; some are also linkable entities)
  for (const w of FAN_WORKS) {
    nodeMap.set(w.id, {
      id: w.id,
      type: 'fanWork',
      title: w.title,
      summary: w.summary,
      visibility: w.visibility,
      status: 'published',
      schemaVersion: 1,
      ownerId: w.authorId,
      tags: w.tags,
      previewKind: w.coverKind ?? w.type,
      payloadRef: { kind: 'fanWorkBody' },
      shareCode: w.shareCode,
      publicPathLabel: w.publicPathLabel,
      createdAtLabel: w.createdAtLabel,
      updatedAtLabel: w.updatedAtLabel,
    });
  }

  // 3) Workshop packages (browse samples become workshopPackage nodes)
  for (const s of WORKSHOP_BROWSE_SAMPLES) {
    const slug = s.id.replace(/^sample\./, '');
    nodeMap.set(s.id, {
      id: s.id,
      type: 'workshopPackage',
      title: s.title['zh-CN'],
      summary: s.description['zh-CN'],
      visibility: 'public',
      status: 'published',
      schemaVersion: 1,
      ownerId: 'author-sample',
      tags: s.attributeTags,
      previewKind: s.previewImageKind,
      payloadRef: { kind: 'workshopPayload' },
      shareCode: `WS-${slug.toUpperCase()}`,
      publicPathLabel: `/share/workshop/${slug}`,
      updatedAtLabel: s.lastUpdatedLabel,
    });
  }

  // ── Edges ──────────────────────────────────────────────────────────────────
  const relations: EntityRelation[] = [];
  const seen = new Set<string>();
  let synth = 0;

  const addRelation = (rel: EntityRelation): void => {
    const key = `${rel.sourceId}|${rel.targetId}|${rel.relationType}`;
    if (seen.has(key)) return;
    // Corrupt-object isolation: skip dangling edges.
    if (!nodeMap.has(rel.sourceId) || !nodeMap.has(rel.targetId)) return;
    seen.add(key);
    relations.push(rel);
  };

  // 4) Canonical legacy relations (fanWork→object, workshop→object/fanWork)
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

  // 5) FanWork → WorkshopPackage (from relatedWorkshopItemIds)
  for (const w of FAN_WORKS) {
    for (const wsId of w.relatedWorkshopItemIds ?? []) {
      const src = nodeMap.get(w.id);
      const tgt = nodeMap.get(wsId);
      if (!src || !tgt) continue;
      addRelation({
        id: `seed-fw-ws-${synth++}`,
        sourceId: w.id,
        sourceType: src.type,
        targetId: wsId,
        targetType: tgt.type,
        relationType: 'relatedTo',
        label: 'relatedTo',
      });
    }
  }

  // 6) WorkshopPackage → FanWork (from the legacy workshop→fanwork map)
  for (const [wsId, fwIds] of Object.entries(RELATED_FAN_WORKS_BY_WORKSHOP)) {
    const src = nodeMap.get(wsId);
    if (!src) continue;
    for (const fwId of fwIds) {
      const tgt = nodeMap.get(fwId);
      if (!tgt) continue;
      addRelation({
        id: `seed-ws-fw-${synth++}`,
        sourceId: wsId,
        sourceType: src.type,
        targetId: fwId,
        targetType: tgt.type,
        relationType: 'relatedTo',
        label: 'relatedTo',
      });
    }
  }

  return { nodes: [...nodeMap.values()], relations };
}

export const ENTITY_GRAPH_SEED: EntityGraphSeed = buildSeed();
