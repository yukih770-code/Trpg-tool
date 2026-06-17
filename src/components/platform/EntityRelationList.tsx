/**
 * EntityRelationList
 * AI-LANDMARK: GRAPH_FIRST_ENTITY_GRAPH_DOMAIN_MODEL_V1
 * (supersedes LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1 relationIds list)
 *
 * Renders the object relations of an entity, resolved through the
 * EntityGraphRepository (NOT a hand-passed relationIds array). Each related
 * object opens a local card/preview, not a route.
 */
import { LINKABLE_OBJECT_TYPES, toEntitySummary } from '../../lib/architecture/entityGraph';
import { platformRepo } from '../../lib/architecture/repositoryComposition';
import { LinkableEntityCard } from './LinkableEntityCard';

export type EntityRelationListProps = {
  entityId: string;
  t: (key: string) => string;
  onSelectEntity?: (id: string) => void;
  emptyKey?: string;
};

export function EntityRelationList({ entityId, t, onSelectEntity, emptyKey }: EntityRelationListProps) {
  const related = platformRepo.entityGraph.getRelatedEntities(entityId, {
    direction: 'outgoing',
    types: LINKABLE_OBJECT_TYPES,
  });

  if (related.length === 0) {
    return <p className="text-[11px] text-[#51483d]/60">{t(emptyKey ?? 'fanPlaza.relations.empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {related.map((rel) => (
        <LinkableEntityCard
          key={rel.relation.id}
          entity={toEntitySummary(rel.entity)}
          t={t}
          relationKindLabel={t(`fanPlaza.relationKind.${rel.relation.relationType}`)}
          onView={onSelectEntity}
        />
      ))}
    </div>
  );
}
