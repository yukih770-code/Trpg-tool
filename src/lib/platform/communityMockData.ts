/**
 * Platform Community / Fan Work — static mock data (scaffold only).
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Static example fan works. No real upload / image / audio / backend.
 */
import type { FanWork } from './communityTypes';
import { WORKSHOP_BROWSE_SAMPLES, type WorkshopBrowseItem } from './workshopTypes';

export const FAN_WORKS: FanWork[] = [
  {
    id: 'fw-elyna-diary',
    title: '艾琳娜的流亡日记',
    authorId: 'author-sample',
    authorName: '示例作者',
    type: 'story',
    format: 'mixed',
    coverMode: 'authorSelected',
    coverKind: 'story',
    coverLabel: '流亡日记封面',
    contentBlocks: ['text', 'image', 'relationEmbed', 'audio'],
    summary: '以艾琳娜视角写就的流亡见闻，穿插旅途速写。',
    bodyPreview: '灰雾再一次漫过边境的清晨。我合上导师的旧信，把它压在背包最底层……',
    tags: ['艾琳娜', '流亡', '日记'],
    systemId: 'dnd5e2024',
    visibility: 'public',
    shareCode: 'FW-ELYNA-DIARY',
    publicPathLabel: '/share/fanwork/elyna-diary',
    relationIds: ['rel-1', 'rel-2'],
    relatedWorkshopItemIds: ['sample.dnd-starter-character-template'],
    createdAtLabel: '2026-05-20',
    updatedAtLabel: '2026-06-01',
    likeCount: 128,
    favoriteCount: 64,
    commentCount: 12,
  },
  {
    id: 'fw-castle-night',
    title: '第 4 回：古堡之夜',
    authorId: 'author-sample',
    authorName: '示例作者',
    type: 'campaignRecap',
    format: 'mixed',
    coverMode: 'firstImage',
    coverKind: 'campaignRecap',
    contentBlocks: ['text', 'image', 'relationEmbed', 'workshopEmbed'],
    summary: '队伍在灰雾古堡度过的不眠之夜的战报回顾。',
    bodyPreview: '大厅的烛火被穿堂风吹得摇曳，艾琳娜第一个察觉到墙后的脚步声……',
    tags: ['战报', '古堡', '第 4 回'],
    systemId: 'dnd5e2024',
    visibility: 'public',
    shareCode: 'FW-CASTLE-N4',
    publicPathLabel: '/share/fanwork/castle-night-4',
    relationIds: ['rel-3', 'rel-4', 'rel-5'],
    relatedWorkshopItemIds: ['sample.castle-investigation-maps'],
    createdAtLabel: '2026-05-22',
    updatedAtLabel: '2026-05-22',
    likeCount: 87,
    favoriteCount: 30,
    commentCount: 9,
  },
  {
    id: 'fw-graycastle-music',
    title: '灰雾古堡印象曲',
    authorId: 'author-sample',
    authorName: '示例作者',
    type: 'music',
    format: 'audio',
    coverMode: 'audioVisual',
    coverKind: 'music',
    contentBlocks: ['audio', 'text', 'relationEmbed'],
    summary: '为灰雾古堡创作的氛围印象曲（音频预留）。',
    bodyPreview: '【音频预留】低音弦乐与雾号，描绘古堡的阴郁与不安。',
    tags: ['音乐', '氛围', '灰雾古堡'],
    systemId: 'generic',
    visibility: 'public',
    shareCode: 'FW-GRAYCASTLE-MUS',
    publicPathLabel: '/share/fanwork/graycastle-music',
    relationIds: ['rel-7'],
    relatedWorkshopItemIds: ['sample.night-city-ambience'],
    createdAtLabel: '2026-05-25',
    updatedAtLabel: '2026-05-26',
    likeCount: 56,
    favoriteCount: 41,
    commentCount: 4,
  },
  {
    id: 'fw-elyna-sketch',
    title: '艾琳娜角色速写',
    authorId: 'author-sample',
    authorName: '示例作者',
    type: 'illustration',
    format: 'imageGallery',
    coverMode: 'firstImage',
    coverKind: 'illustration',
    contentBlocks: ['imageGallery', 'text', 'relationEmbed'],
    summary: '艾琳娜的角色速写合集（图片预留）。',
    bodyPreview: '【图片预留】铅笔速写：流亡途中的艾琳娜与她的旧信。',
    tags: ['插画', '艾琳娜', '速写'],
    systemId: 'dnd5e2024',
    visibility: 'public',
    shareCode: 'FW-ELYNA-SKETCH',
    publicPathLabel: '/share/fanwork/elyna-sketch',
    relationIds: ['rel-8'],
    relatedWorkshopItemIds: ['sample.dnd-starter-character-template'],
    createdAtLabel: '2026-05-28',
    updatedAtLabel: '2026-05-28',
    likeCount: 203,
    favoriteCount: 150,
    commentCount: 21,
  },
  {
    id: 'fw-graycastle-setting',
    title: '灰雾古堡世界观笔记',
    authorId: 'author-sample',
    authorName: '示例作者',
    type: 'setting',
    format: 'mixed',
    coverMode: 'typeFallback',
    coverKind: 'setting',
    contentBlocks: ['text', 'relationEmbed', 'externalLink'],
    summary: '灰雾古堡与灰雾边境的世界观设定笔记。',
    bodyPreview: '灰雾边境并非天然之雾，而是百年前那场仪式留下的余烬……',
    tags: ['设定', '世界观', '灰雾边境'],
    systemId: 'original',
    visibility: 'public',
    shareCode: 'FW-GRAYCASTLE-SET',
    publicPathLabel: '/share/fanwork/graycastle-setting',
    relationIds: ['rel-9', 'rel-10'],
    createdAtLabel: '2026-05-30',
    updatedAtLabel: '2026-06-03',
    likeCount: 74,
    favoriteCount: 52,
    commentCount: 7,
  },
];

export function getFanWorkById(id: string): FanWork | undefined {
  return FAN_WORKS.find((w) => w.id === id);
}

/**
 * Resolve the cover/fallback kind for a fan work.
 * Embodies the priority authorSelected → firstImage → audioVisual → typeFallback:
 * the cover SOURCE is `work.coverMode`; the fallback VISUAL kind is `coverKind ?? type`.
 */
export function fanWorkCoverKind(work: FanWork): FanWork['type'] {
  return work.coverKind ?? work.type;
}

/**
 * Fan works related to a workshop item (association display only).
 * Accepts both linkable-entity ids (ws-elyna-template) and browse-sample ids.
 * Scaffold static mapping — not subscription / dependency / conflict logic.
 */
/**
 * @deprecated Seed source only. Consumed by `lib/architecture/entityGraphSeed`
 * to build the authoritative EntityGraph. Do NOT query this directly from UI —
 * use `EntityGraphRepository` instead.
 */
export const RELATED_FAN_WORKS_BY_WORKSHOP: Record<string, string[]> = {
  'ws-elyna-template': ['fw-elyna-diary', 'fw-elyna-sketch', 'fw-castle-night'],
  'sample.dnd-starter-character-template': ['fw-elyna-diary', 'fw-elyna-sketch', 'fw-castle-night'],
  'sample.castle-investigation-maps': ['fw-castle-night'],
  'sample.dnd-expansion-rules': ['fw-elyna-diary'],
  'sample.night-city-ambience': ['fw-graycastle-music'],
};

/** @deprecated Superseded by `EntityGraphRepository.getRelatedFanWorks`. Retained as seed source only. */
export function getRelatedFanWorkIdsForWorkshopItem(workshopItemId: string): string[] {
  return RELATED_FAN_WORKS_BY_WORKSHOP[workshopItemId] ?? [];
}

/** @deprecated Superseded by `EntityGraphRepository.getRelatedWorkshopPackages`. Retained as seed source only. */
export function getRelatedWorkshopItems(work: FanWork): WorkshopBrowseItem[] {
  return (work.relatedWorkshopItemIds ?? [])
    .map((id) => WORKSHOP_BROWSE_SAMPLES.find((w) => w.id === id))
    .filter((w): w is WorkshopBrowseItem => Boolean(w));
}
