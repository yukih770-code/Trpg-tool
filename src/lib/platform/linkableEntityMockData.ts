/**
 * Platform Linkable Entity — static mock data (scaffold only).
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Static example objects and relations used by Fan Plaza / relation previews.
 * No store, no backend, no real share links.
 */
import type { EntityRelation, LinkableEntitySummary } from './linkableEntityTypes';

export const LINKABLE_ENTITIES: LinkableEntitySummary[] = [
  {
    id: 'act-elyna',
    type: 'actor',
    title: '艾琳娜',
    subtitle: '流亡贵族 / 法师',
    summary: '灰雾边境的流亡者，背负导师的旧约。',
    visibility: 'public',
    shareCode: 'ACT-ELYNA',
    publicPathLabel: '/share/actor/elyna',
    tags: ['DND 5e 2024', '法师', '流亡'],
  },
  {
    id: 'cam-graycastle',
    type: 'campaign',
    title: '灰雾古堡',
    subtitle: '调查 / 恐怖',
    summary: '一座笼罩在灰雾中的古堡，藏着旧日之秘。',
    visibility: 'unlisted',
    shareCode: 'CAM-GRAYCASTLE',
    publicPathLabel: '/share/campaign/graycastle',
    tags: ['战役', '古堡', '调查'],
  },
  {
    id: 'map-castle-hall',
    type: 'map',
    title: '古堡大厅',
    summary: '灰雾古堡的中央大厅地图。',
    visibility: 'campaignOnly',
    shareCode: 'MAP-CASTLE-HALL',
    publicPathLabel: '/share/map/castle-hall',
    tags: ['地图', '室内'],
  },
  {
    id: 'log-castle-night',
    type: 'sessionLog',
    title: '第 4 回：古堡之夜',
    summary: '队伍在古堡度过的不眠之夜的战役日志。',
    visibility: 'campaignOnly',
    shareCode: 'LOG-CASTLE-N4',
    publicPathLabel: '/share/log/castle-night-4',
    tags: ['战役日志', '第 4 回'],
  },
  {
    id: 'ws-elyna-template',
    type: 'workshopItem',
    title: '艾琳娜角色模板',
    subtitle: '创意工坊内容',
    summary: '基于艾琳娜的可游玩角色模板（创意工坊）。',
    visibility: 'public',
    shareCode: 'WS-ELYNA-TPL',
    publicPathLabel: '/share/workshop/elyna-template',
    tags: ['角色模板', '创意工坊'],
  },
  {
    id: 'fw-elyna-diary',
    type: 'fanWork',
    title: '艾琳娜的流亡日记',
    subtitle: '同人故事',
    summary: '以艾琳娜视角写就的流亡见闻。',
    visibility: 'public',
    shareCode: 'FW-ELYNA-DIARY',
    publicPathLabel: '/share/fanwork/elyna-diary',
    tags: ['故事', '同人'],
  },
  {
    id: 'music-graycastle',
    type: 'music',
    title: '灰雾古堡印象曲',
    summary: '为灰雾古堡创作的氛围印象曲。',
    visibility: 'public',
    shareCode: 'MUS-GRAYCASTLE',
    publicPathLabel: '/share/music/graycastle',
    tags: ['音乐', '氛围'],
  },
  {
    id: 'handout-mentor-letter',
    type: 'handout',
    title: '导师的旧信',
    summary: '一封交给艾琳娜的旧信 handout。',
    visibility: 'campaignOnly',
    shareCode: 'HO-MENTOR-LTR',
    publicPathLabel: '/share/handout/mentor-letter',
    tags: ['handout', '线索'],
  },
  {
    id: 'world-grayfrontier',
    type: 'world',
    title: '灰雾边境',
    subtitle: '世界观设定',
    summary: '灰雾古堡所处的边境世界观设定。',
    visibility: 'public',
    shareCode: 'WLD-GRAYFRONTIER',
    publicPathLabel: '/share/world/grayfrontier',
    tags: ['世界观', '设定'],
  },
];

export const ENTITY_RELATIONS: EntityRelation[] = [
  { id: 'rel-1', sourceType: 'fanWork',     sourceId: 'fw-elyna-diary',  targetType: 'actor',    targetId: 'act-elyna',      relationKind: 'features',    label: 'features' },
  { id: 'rel-2', sourceType: 'fanWork',     sourceId: 'fw-elyna-diary',  targetType: 'campaign', targetId: 'cam-graycastle', relationKind: 'belongsTo',   label: 'belongsTo' },
  { id: 'rel-3', sourceType: 'fanWork',     sourceId: 'fw-castle-night', targetType: 'campaign', targetId: 'cam-graycastle', relationKind: 'recaps',      label: 'recaps' },
  { id: 'rel-4', sourceType: 'fanWork',     sourceId: 'fw-castle-night', targetType: 'actor',    targetId: 'act-elyna',      relationKind: 'mentions',    label: 'mentions' },
  { id: 'rel-5', sourceType: 'fanWork',     sourceId: 'fw-castle-night', targetType: 'map',      targetId: 'map-castle-hall', relationKind: 'uses',       label: 'uses' },
  { id: 'rel-6', sourceType: 'workshopItem', sourceId: 'ws-elyna-template', targetType: 'actor', targetId: 'act-elyna',      relationKind: 'adaptedFrom', label: 'adaptedFrom' },
  { id: 'rel-7', sourceType: 'fanWork',     sourceId: 'fw-graycastle-music', targetType: 'campaign', targetId: 'cam-graycastle', relationKind: 'inspiredBy', label: 'inspiredBy' },
  { id: 'rel-8', sourceType: 'fanWork',     sourceId: 'fw-elyna-sketch', targetType: 'actor',    targetId: 'act-elyna',      relationKind: 'features',    label: 'features' },
  { id: 'rel-9', sourceType: 'fanWork',     sourceId: 'fw-graycastle-setting', targetType: 'world', targetId: 'world-grayfrontier', relationKind: 'relatedTo', label: 'relatedTo' },
  { id: 'rel-10', sourceType: 'fanWork',    sourceId: 'fw-graycastle-setting', targetType: 'campaign', targetId: 'cam-graycastle', relationKind: 'belongsTo', label: 'belongsTo' },
  // Workshop item ↔ fan work (related fan works, non-subscription association)
  { id: 'rel-11', sourceType: 'workshopItem', sourceId: 'ws-elyna-template', targetType: 'fanWork', targetId: 'fw-elyna-diary', relationKind: 'relatedTo', label: 'relatedTo' },
  { id: 'rel-12', sourceType: 'workshopItem', sourceId: 'ws-elyna-template', targetType: 'fanWork', targetId: 'fw-elyna-sketch', relationKind: 'relatedTo', label: 'relatedTo' },
];

export function getEntityById(id: string): LinkableEntitySummary | undefined {
  return LINKABLE_ENTITIES.find((e) => e.id === id);
}

export function getRelationsByIds(ids: string[]): EntityRelation[] {
  return ids
    .map((id) => ENTITY_RELATIONS.find((r) => r.id === id))
    .filter((r): r is EntityRelation => Boolean(r));
}

export function getRelationsFromSource(sourceId: string): EntityRelation[] {
  return ENTITY_RELATIONS.filter((r) => r.sourceId === sourceId);
}
