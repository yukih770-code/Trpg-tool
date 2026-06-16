/**
 * EntityRelationList
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Given a set of relation ids, renders the related entities (resolved target)
 * with their relation kind. Used in fan-work detail and (future) workshop preview.
 * Static only — selecting an entity opens a local card/preview, not a route.
 */
import { getEntityById, getRelationsByIds } from '../../lib/platform/linkableEntityMockData';
import { LinkableEntityCard } from './LinkableEntityCard';

export type EntityRelationListProps = {
  relationIds: string[];
  t: (key: string) => string;
  onSelectEntity?: (id: string) => void;
  emptyKey?: string;
};

export function EntityRelationList({ relationIds, t, onSelectEntity, emptyKey }: EntityRelationListProps) {
  const relations = getRelationsByIds(relationIds);

  if (relations.length === 0) {
    return <p className="text-[11px] text-[#51483d]/60">{t(emptyKey ?? 'fanPlaza.relations.empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {relations.map((rel) => {
        const target = getEntityById(rel.targetId);
        if (!target) return null;
        return (
          <LinkableEntityCard
            key={rel.id}
            entity={target}
            t={t}
            relationKindLabel={t(`fanPlaza.relationKind.${rel.relationKind}`)}
            onView={onSelectEntity}
          />
        );
      })}
    </div>
  );
}
