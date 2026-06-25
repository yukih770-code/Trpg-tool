/**
 * Runtime layout contracts (v0, types only).
 *
 * AI-LANDMARK: RUNTIME_LAYOUT_CONTRACTS_V0
 *
 * Runtime layout contracts are PLATFORM-level. They define modes, slots,
 * placements, and projection visibility. They do NOT define DND/COC/CP RED
 * rules. System-specific content such as AC, spell slots, SAN, Humanity, SP,
 * death saves, class resources, and weapon actions must be rendered by SYSTEM
 * panels inside platform slots (e.g. into `systemPanel` / `contextInspector` /
 * `actorRail`) — never modeled here.
 *
 * No UI, no renderer, no map engine, no Action Dock, no floating panels. This
 * module declares shapes + default contracts only.
 */

export type RuntimeLayoutMode = 'tacticalMap' | 'theaterScene' | 'investigationCase';

export type RuntimeCanvasKind =
  | 'map' // tactical grid / tokens (future)
  | 'scene' // narrative scene / ambiance / NPC focus
  | 'caseBoard' // clue board / relationship graph / evidence
  | 'placeholder'; // current placeholder stage

export interface RuntimeLayoutModeDefinition {
  mode: RuntimeLayoutMode;
  label: string;
  description: string;
  primaryCanvasKind: RuntimeCanvasKind;
}

export type RuntimeLayoutSlotId =
  | 'runtimeCanvas'
  | 'actorRail'
  | 'turnOrFocusRail'
  | 'contextInspector'
  | 'actionDock'
  | 'logDrawer'
  | 'toolPalette'
  | 'handoutPanel'
  | 'notesPanel'
  | 'systemPanel'
  | 'devPanel';

export type RuntimeLayoutSlotPlacement =
  | 'canvas'
  | 'left'
  | 'right'
  | 'bottom'
  | 'top'
  | 'drawer'
  | 'overlay'
  | 'hidden';

export type RuntimeLayoutSlotDefaultState = 'expanded' | 'collapsed' | 'hidden';

export interface RuntimeLayoutSlotDefinition {
  id: RuntimeLayoutSlotId;
  placement: RuntimeLayoutSlotPlacement;
  defaultState: RuntimeLayoutSlotDefaultState;
  /** Platform owns the container itself (e.g. LogDrawer, Canvas slot). */
  isPlatformOwned: boolean;
  /** A system (DND/COC/CP RED) may render its own content into this slot. */
  allowsSystemContent: boolean;
  description?: string;
}

export type RuntimeProjectionRole = 'host' | 'player' | 'spectator';

export interface RuntimeLayoutProjectionRule {
  role: RuntimeProjectionRole;
  visibleSlots: RuntimeLayoutSlotId[];
  defaultExpandedSlots: RuntimeLayoutSlotId[];
  hiddenSlots: RuntimeLayoutSlotId[];
}

export interface RuntimeLayoutModeContract {
  mode: RuntimeLayoutMode;
  canvasKind: RuntimeCanvasKind;
  slots: RuntimeLayoutSlotDefinition[];
  projections: RuntimeLayoutProjectionRule[];
}

// ── Slot metadata (platform/system ownership is mode-independent) ────────────
interface SlotMeta {
  isPlatformOwned: boolean;
  allowsSystemContent: boolean;
  description: string;
}

const SLOT_META: Record<RuntimeLayoutSlotId, SlotMeta> = {
  runtimeCanvas: { isPlatformOwned: true, allowsSystemContent: true, description: 'Central canvas container; the mode decides its content (map/scene/board).' },
  actorRail: { isPlatformOwned: true, allowsSystemContent: true, description: 'Container for participant/actor chips; systems render the status content.' },
  turnOrFocusRail: { isPlatformOwned: true, allowsSystemContent: true, description: 'Initiative/turn order or scene focus; optional per mode.' },
  contextInspector: { isPlatformOwned: true, allowsSystemContent: true, description: 'Selected-entity detail container; systems render the detail.' },
  actionDock: { isPlatformOwned: true, allowsSystemContent: true, description: 'Available actions/rolls container; systems supply items.' },
  logDrawer: { isPlatformOwned: true, allowsSystemContent: false, description: 'Runtime log viewer (platform-owned).' },
  toolPalette: { isPlatformOwned: true, allowsSystemContent: true, description: 'Host/GM tools; host-only.' },
  handoutPanel: { isPlatformOwned: true, allowsSystemContent: false, description: 'Shared handouts / reveals.' },
  notesPanel: { isPlatformOwned: true, allowsSystemContent: false, description: 'Private / shared notes.' },
  systemPanel: { isPlatformOwned: false, allowsSystemContent: true, description: 'System-specific content container (AC/SAN/SP/etc. live here, supplied by the system).' },
  devPanel: { isPlatformOwned: true, allowsSystemContent: false, description: 'Development-only; never shown in player or spectator production projection.' },
};

function slot(
  id: RuntimeLayoutSlotId,
  placement: RuntimeLayoutSlotPlacement,
  defaultState: RuntimeLayoutSlotDefaultState,
): RuntimeLayoutSlotDefinition {
  const meta = SLOT_META[id];
  return {
    id,
    placement,
    defaultState,
    isPlatformOwned: meta.isPlatformOwned,
    allowsSystemContent: meta.allowsSystemContent,
    description: meta.description,
  };
}

export const RUNTIME_LAYOUT_MODE_DEFINITIONS: RuntimeLayoutModeDefinition[] = [
  { mode: 'tacticalMap', label: '战术地图 Tactical Map', description: '位置 / 范围 / 回合制场景（DND 战斗、CP RED 枪战）。', primaryCanvasKind: 'map' },
  { mode: 'theaterScene', label: '剧情场景 Theater / Scene', description: 'RP、过场、NPC 互动、氛围场景。', primaryCanvasKind: 'scene' },
  { mode: 'investigationCase', label: '调查案件 Investigation / Case', description: '线索板 / 关系图 / 证据整理（COC 调查、解谜、数据调查）。', primaryCanvasKind: 'caseBoard' },
];

// ── Tactical Map Mode ───────────────────────────────────────────────────────
const TACTICAL_MAP_CONTRACT: RuntimeLayoutModeContract = {
  mode: 'tacticalMap',
  canvasKind: 'map',
  slots: [
    slot('runtimeCanvas', 'canvas', 'expanded'),
    slot('actorRail', 'left', 'expanded'),
    slot('turnOrFocusRail', 'left', 'expanded'),
    slot('contextInspector', 'right', 'collapsed'),
    slot('actionDock', 'bottom', 'expanded'),
    slot('logDrawer', 'drawer', 'collapsed'),
    slot('toolPalette', 'overlay', 'collapsed'),
    slot('handoutPanel', 'drawer', 'collapsed'),
    slot('notesPanel', 'drawer', 'collapsed'),
    slot('systemPanel', 'right', 'collapsed'),
    slot('devPanel', 'overlay', 'hidden'),
  ],
  projections: [
    {
      role: 'host',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'turnOrFocusRail', 'contextInspector', 'actionDock', 'logDrawer', 'toolPalette', 'handoutPanel', 'notesPanel', 'systemPanel', 'devPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'actorRail', 'turnOrFocusRail', 'actionDock', 'logDrawer'],
      hiddenSlots: [],
    },
    {
      role: 'player',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'turnOrFocusRail', 'contextInspector', 'actionDock', 'logDrawer', 'handoutPanel', 'notesPanel', 'systemPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'actorRail', 'actionDock'],
      hiddenSlots: ['toolPalette', 'devPanel'],
    },
    {
      role: 'spectator',
      visibleSlots: ['runtimeCanvas', 'logDrawer', 'handoutPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'logDrawer'],
      hiddenSlots: ['actorRail', 'turnOrFocusRail', 'contextInspector', 'actionDock', 'toolPalette', 'notesPanel', 'systemPanel', 'devPanel'],
    },
  ],
};

// ── Theater / Scene Mode ────────────────────────────────────────────────────
const THEATER_SCENE_CONTRACT: RuntimeLayoutModeContract = {
  mode: 'theaterScene',
  canvasKind: 'scene',
  slots: [
    slot('runtimeCanvas', 'canvas', 'expanded'),
    slot('actorRail', 'left', 'expanded'),
    slot('turnOrFocusRail', 'hidden', 'hidden'),
    slot('contextInspector', 'right', 'collapsed'),
    slot('actionDock', 'bottom', 'collapsed'),
    slot('logDrawer', 'drawer', 'expanded'),
    slot('toolPalette', 'overlay', 'collapsed'),
    slot('handoutPanel', 'right', 'expanded'),
    slot('notesPanel', 'drawer', 'collapsed'),
    slot('systemPanel', 'right', 'collapsed'),
    slot('devPanel', 'overlay', 'hidden'),
  ],
  projections: [
    {
      role: 'host',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'contextInspector', 'actionDock', 'logDrawer', 'toolPalette', 'handoutPanel', 'notesPanel', 'systemPanel', 'devPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'actorRail', 'handoutPanel', 'logDrawer'],
      hiddenSlots: ['turnOrFocusRail'],
    },
    {
      role: 'player',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'contextInspector', 'actionDock', 'logDrawer', 'handoutPanel', 'notesPanel', 'systemPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'handoutPanel', 'logDrawer'],
      hiddenSlots: ['turnOrFocusRail', 'toolPalette', 'devPanel'],
    },
    {
      role: 'spectator',
      visibleSlots: ['runtimeCanvas', 'logDrawer', 'handoutPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'logDrawer'],
      hiddenSlots: ['actorRail', 'turnOrFocusRail', 'contextInspector', 'actionDock', 'toolPalette', 'notesPanel', 'systemPanel', 'devPanel'],
    },
  ],
};

// ── Investigation / Case Mode ───────────────────────────────────────────────
const INVESTIGATION_CASE_CONTRACT: RuntimeLayoutModeContract = {
  mode: 'investigationCase',
  canvasKind: 'caseBoard',
  slots: [
    slot('runtimeCanvas', 'canvas', 'expanded'),
    slot('actorRail', 'left', 'expanded'),
    slot('turnOrFocusRail', 'hidden', 'hidden'),
    slot('contextInspector', 'right', 'collapsed'),
    slot('actionDock', 'bottom', 'collapsed'),
    slot('logDrawer', 'drawer', 'collapsed'),
    slot('toolPalette', 'overlay', 'collapsed'),
    slot('handoutPanel', 'drawer', 'collapsed'),
    slot('notesPanel', 'right', 'expanded'),
    slot('systemPanel', 'right', 'collapsed'),
    slot('devPanel', 'overlay', 'hidden'),
  ],
  projections: [
    {
      role: 'host',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'contextInspector', 'actionDock', 'logDrawer', 'toolPalette', 'handoutPanel', 'notesPanel', 'systemPanel', 'devPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'actorRail', 'notesPanel', 'logDrawer'],
      hiddenSlots: ['turnOrFocusRail'],
    },
    {
      role: 'player',
      visibleSlots: ['runtimeCanvas', 'actorRail', 'contextInspector', 'actionDock', 'logDrawer', 'handoutPanel', 'notesPanel', 'systemPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'notesPanel', 'logDrawer'],
      hiddenSlots: ['turnOrFocusRail', 'toolPalette', 'devPanel'],
    },
    {
      role: 'spectator',
      visibleSlots: ['runtimeCanvas', 'logDrawer', 'handoutPanel'],
      defaultExpandedSlots: ['runtimeCanvas', 'logDrawer'],
      hiddenSlots: ['actorRail', 'turnOrFocusRail', 'contextInspector', 'actionDock', 'toolPalette', 'notesPanel', 'systemPanel', 'devPanel'],
    },
  ],
};

export const RUNTIME_LAYOUT_MODE_CONTRACTS: RuntimeLayoutModeContract[] = [
  TACTICAL_MAP_CONTRACT,
  THEATER_SCENE_CONTRACT,
  INVESTIGATION_CASE_CONTRACT,
];

/** Look up a mode's layout contract. */
export function getRuntimeLayoutModeContract(
  mode: RuntimeLayoutMode,
): RuntimeLayoutModeContract | undefined {
  return RUNTIME_LAYOUT_MODE_CONTRACTS.find((c) => c.mode === mode);
}
