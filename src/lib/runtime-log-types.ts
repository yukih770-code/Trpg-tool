export type RuntimeLogSystem = 'dnd' | 'coc' | 'cpred';

export type RuntimeLogVisibility =
  | 'public'
  | 'gmOnly'
  | 'playerOnly'
  | 'revealed';

export type RuntimeLogRevealMode =
  | 'showFull'
  | 'showOutcome'
  | 'showNarration'
  | 'hidden';

export type RuntimeLogKind =
  | 'check'
  | 'roll'
  | 'action'
  | 'damage'
  | 'resource'
  | 'system'
  | 'narration';

export type RuntimeLogEntry = {
  id: string;
  timestamp: number;
  system: RuntimeLogSystem;
  kind: RuntimeLogKind;

  title: string;
  summary: string;
  detail?: string;

  displayValue?: number | string;
  calculation?: string;
  outcome?: string;

  visibility: RuntimeLogVisibility;
  revealMode?: RuntimeLogRevealMode;

  actorId?: string;
  actorName?: string;
  ownerCharacterId?: string;
  targetId?: string;
  targetName?: string;

  tags?: string[];

  payload?: unknown;
};
