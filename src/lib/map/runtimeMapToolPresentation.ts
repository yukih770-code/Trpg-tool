export type RuntimeMapToolId = 'select' | 'move' | 'measure' | 'background' | 'grid' | 'template' | 'units';

export type RuntimeMapToolPresentation = {
  id: RuntimeMapToolId;
  shortLabel: string;
};

const HOST_RUNTIME_MAP_TOOL_IDS: RuntimeMapToolId[] = ['select', 'move', 'measure', 'background', 'grid', 'template', 'units'];
const PARTICIPANT_RUNTIME_MAP_TOOL_IDS: RuntimeMapToolId[] = ['select', 'move', 'measure', 'template'];

const SHORT_LABELS: Record<'zh' | 'en', Record<RuntimeMapToolId, string>> = {
  zh: { select: '选择', move: '移动', measure: '测距', background: '底图', grid: '网格', template: '范围', units: 'Token' },
  en: { select: 'Select', move: 'Move', measure: 'Measure', background: 'Map', grid: 'Grid', template: 'Area', units: 'Token' },
};

export function getRuntimeMapToolPresentation(isHost: boolean, locale: 'zh' | 'en'): RuntimeMapToolPresentation[] {
  const ids = isHost ? HOST_RUNTIME_MAP_TOOL_IDS : PARTICIPANT_RUNTIME_MAP_TOOL_IDS;
  return ids.map((id) => ({ id, shortLabel: SHORT_LABELS[locale][id] }));
}
