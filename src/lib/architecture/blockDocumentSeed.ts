/**
 * BlockDocument seed — a few static example documents for A9 (Live Object
 * Document Slice). References existing EntityGraph nodes by id only.
 *
 * AI-LANDMARK: BLOCK_DOCUMENT_SEED_V1
 *
 * No DB, no backend. Entity references are id+type only; their relations are
 * projected to the EntityGraph via `projectDocumentRelations` (A9), not stored
 * here as authority.
 */
import type { BlockDocument } from './blockDocument';

export const BLOCK_DOCUMENT_SEED: BlockDocument[] = [
  {
    id: 'doc-elyna-diary-ch1',
    schemaVersion: 1,
    title: '艾琳娜的流亡日记 · 第一章',
    summary: '流亡途中的第一篇日记，穿插对灰雾古堡的回忆。',
    ownerId: 'author-sample',
    visibility: 'public',
    status: 'published',
    blocks: [
      { id: 'b1', type: 'heading', level: 1, text: '灰雾再一次漫过边境' },
      {
        id: 'b2',
        type: 'text',
        text: {
          text: '我合上导师的旧信，把它压在背包最底层。天还没亮，雾就先到了。',
          marks: [{ type: 'italic', start: 0, end: 8 }],
        },
      },
      { id: 'b3', type: 'entityCard', ref: { entityId: 'act-elyna', entityType: 'actor' } },
      {
        id: 'b4',
        type: 'image',
        mediaAssetId: 'media-elyna-sketch-1',
        caption: '流亡途中的速写（占位）',
        placeholderKind: 'character',
      },
      {
        id: 'b5',
        type: 'text',
        text: { text: '我又想起了那座古堡——' },
      },
      { id: 'b6', type: 'entityMention', ref: { entityId: 'cam-graycastle', entityType: 'campaign' }, label: '灰雾古堡' },
      { id: 'b7', type: 'callout', tone: 'note', text: { text: '本章为公开节选，完整日记与隐藏剧情不在公开页展示。' } },
    ],
    relatedEntityIds: ['act-elyna', 'cam-graycastle'],
    payloadRef: { kind: 'inline' },
    createdAt: '2026-05-20',
    updatedAt: '2026-06-01',
  },
  {
    id: 'doc-castle-session-4',
    schemaVersion: 1,
    title: '第 4 回：古堡之夜 · 公开摘要',
    summary: '队伍在灰雾古堡度过的不眠之夜的公开战报摘要。',
    ownerId: 'author-sample',
    visibility: 'unlisted',
    status: 'published',
    blocks: [
      { id: 'b1', type: 'heading', level: 2, text: '大厅之夜' },
      { id: 'b2', type: 'text', text: { text: '烛火被穿堂风吹得摇曳，艾琳娜第一个察觉到墙后的脚步声。' } },
      { id: 'b3', type: 'entityMention', ref: { entityId: 'act-elyna', entityType: 'actor' }, label: '艾琳娜' },
      { id: 'b4', type: 'mapPreview', ref: { entityId: 'map-castle-hall', entityType: 'map' } },
      { id: 'b5', type: 'callout', tone: 'warning', text: { text: '内部日志（GM 视角）与隐藏 NPC 不在此公开摘要中。' } },
    ],
    relatedEntityIds: ['act-elyna', 'map-castle-hall'],
    payloadRef: { kind: 'inline' },
    createdAt: '2026-05-22',
    updatedAt: '2026-05-22',
  },
  {
    id: 'doc-graycastle-setting',
    schemaVersion: 1,
    title: '灰雾边境 · 世界观笔记',
    summary: '灰雾古堡所处边境的世界观设定笔记。',
    ownerId: 'author-sample',
    visibility: 'public',
    status: 'draft',
    blocks: [
      { id: 'b1', type: 'heading', level: 1, text: '灰雾边境' },
      { id: 'b2', type: 'text', text: { text: '灰雾并非天然之雾，而是百年前那场仪式留下的余烬。' } },
      { id: 'b3', type: 'entityCard', ref: { entityId: 'world-grayfrontier', entityType: 'world' } },
      { id: 'b4', type: 'externalLink', url: '/share/world/grayfrontier', label: '公开世界观页（接口预留）' },
    ],
    relatedEntityIds: ['world-grayfrontier'],
    payloadRef: { kind: 'inline' },
    createdAt: '2026-05-30',
    updatedAt: '2026-06-03',
  },
];

export function getBlockDocumentSeedById(id: string): BlockDocument | undefined {
  return BLOCK_DOCUMENT_SEED.find((d) => d.id === id);
}
