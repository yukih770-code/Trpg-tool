/**
 * WorkshopPackage seed — static example manifests for A10/A11.
 *
 * AI-LANDMARK: WORKSHOP_PACKAGE_SEED_V1
 *
 * References existing EntityGraph nodes (entityGraphSeed) and BlockDocuments
 * (blockDocumentSeed) by id only. Declarations, not copies. No DB, no backend.
 */
import type { WorkshopPackageManifest } from './workshopPackage';

export const WORKSHOP_PACKAGE_SEED: WorkshopPackageManifest[] = [
  {
    packageId: 'pkg-graycastle-campaign',
    manifestVersion: 1,
    schemaVersion: 1,
    title: '灰雾古堡战役素材包',
    summary: '灰雾古堡战役的地图、世界观与公开战报摘要素材包。',
    author: { id: 'author-sample', handle: 'graycastle_gm', displayName: '示例作者' },
    version: 'v1.0.0',
    systemId: 'dnd5e2024',
    status: 'published',
    visibility: 'public',
    tags: ['战役', '古堡', '调查'],
    previewKind: 'adventure',
    includedEntities: [
      { entityId: 'cam-graycastle', entityType: 'campaign', role: 'campaign' },
      { entityId: 'map-castle-hall', entityType: 'map', role: 'battleMap' },
      { entityId: 'world-grayfrontier', entityType: 'world', role: 'setting' },
    ],
    includedDocuments: [
      { documentId: 'doc-castle-session-4', title: '第 4 回：古堡之夜 · 公开摘要', role: 'chapter' },
      { documentId: 'doc-graycastle-setting', title: '灰雾边境 · 世界观笔记', role: 'note' },
    ],
    dependencies: [
      { kind: 'ruleSystem', ref: 'dnd5e2024' },
    ],
    entryPoints: [
      { kind: 'blockDocument', ref: 'doc-castle-session-4', title: '从战报进入', primary: true },
      { kind: 'entity', ref: 'cam-graycastle', entityType: 'campaign', title: '战役主页' },
    ],
    clonePolicy: 'cloneAllowed',
    readOnlyPolicy: 'editableClone',
    sourceTrust: 'community',
    usageNote: { text: '仅供个人跑团使用，公开页不含 GM 隐藏内容。' },
    createdAt: '2026-05-22',
    updatedAt: '2026-06-03',
  },
  {
    packageId: 'pkg-elyna-character-template',
    manifestVersion: 1,
    schemaVersion: 1,
    title: '艾琳娜角色模板包',
    summary: '基于艾琳娜的可克隆角色模板，附角色故事文档。',
    author: { id: 'author-sample', handle: 'elyna_author', displayName: '示例作者' },
    version: 'v1.0.0',
    systemId: 'dnd5e2024',
    status: 'published',
    visibility: 'public',
    tags: ['角色模板', '法师', '流亡'],
    previewKind: 'character',
    includedEntities: [
      { entityId: 'act-elyna', entityType: 'actor', role: 'characterTemplate' },
    ],
    includedDocuments: [
      { documentId: 'doc-elyna-diary-ch1', title: '艾琳娜的流亡日记 · 第一章', role: 'chapter' },
    ],
    dependencies: [
      { kind: 'ruleSystem', ref: 'dnd5e2024' },
    ],
    entryPoints: [
      { kind: 'entity', ref: 'act-elyna', entityType: 'actor', title: '角色模板', primary: true },
    ],
    clonePolicy: 'cloneAllowed',
    readOnlyPolicy: 'editableClone',
    sourceTrust: 'personal',
    createdAt: '2026-05-20',
    updatedAt: '2026-06-01',
  },
  {
    packageId: 'pkg-graycastle-music',
    manifestVersion: 1,
    schemaVersion: 1,
    title: '灰雾古堡氛围音乐包',
    summary: '灰雾古堡印象曲（媒体资料包，仅引用）。',
    author: { id: 'author-sample', handle: 'graycastle_music', displayName: '示例作者' },
    version: 'v1.0.1',
    systemId: 'generic',
    status: 'published',
    visibility: 'unlisted',
    tags: ['音乐', '氛围'],
    previewKind: 'music',
    includedEntities: [
      { entityId: 'music-graycastle', entityType: 'mediaAsset', role: 'ambience' },
    ],
    includedDocuments: [],
    dependencies: [],
    entryPoints: [
      { kind: 'entity', ref: 'music-graycastle', entityType: 'mediaAsset', title: '试听', primary: true },
    ],
    clonePolicy: 'referenceOnly',
    readOnlyPolicy: 'readOnlyReference',
    sourceTrust: 'community',
    usageNote: { text: '授权待确认，仅可加入本地清单引用。' },
    createdAt: '2026-05-25',
    updatedAt: '2026-05-26',
  },
];

export function getWorkshopPackageSeedById(id: string): WorkshopPackageManifest | undefined {
  return WORKSHOP_PACKAGE_SEED.find((p) => p.packageId === id);
}
