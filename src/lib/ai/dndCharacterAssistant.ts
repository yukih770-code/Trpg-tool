import type { BackgroundDef, CharacterData, ClassDef, FeatDef } from '../dnd-types';
import type {
  DndCharacterAssistantGatewayResult,
  DndCharacterAssistantRequest,
  DndPointBuyScores,
} from './dndCharacterAssistantTypes';

export type DndCharacterAssistantIssueCode =
  | 'completed-actor-structural-change'
  | 'level-one-structure-required'
  | 'unknown-class'
  | 'unknown-background'
  | 'unknown-origin-feat'
  | 'background-feat-conflict'
  | 'invalid-point-buy'
  | 'no-applicable-changes';

export type DndCharacterAssistantIssue = {
  code: DndCharacterAssistantIssueCode;
  severity: 'blocker' | 'warning';
  message: string;
};

export type DndCharacterAssistantPlan = {
  suggestionId: string;
  provider: 'ollama';
  model: string;
  summary: string;
  rationale: string[];
  modelWarnings: string[];
  actorId: string;
  baseFingerprint: string;
  createdAt: number;
  changedFields: string[];
  issues: DndCharacterAssistantIssue[];
  ready: boolean;
  nextCharacter?: CharacterData;
};

export type DndCharacterAssistantAuditRecord = {
  auditId: string;
  suggestionId: string;
  actorId: string;
  action: 'applied' | 'reverted';
  provider: 'ollama';
  model: string;
  summary: string;
  changedFields: string[];
  occurredAt: number;
};

export type DndCharacterAssistantCommitReceipt = {
  suggestionId: string;
  actorId: string;
  provider: 'ollama';
  model: string;
  summary: string;
  changedFields: string[];
  before: CharacterData;
  after: CharacterData;
  committedAt: number;
};

const ATTRS = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'] as const;
const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export function buildDndCharacterAssistantRequest(input: {
  intent: string;
  character: CharacterData;
  classes: ClassDef[];
  backgrounds: BackgroundDef[];
  feats: FeatDef[];
}): DndCharacterAssistantRequest {
  const originFeatNames = input.feats.filter((feat) => feat.category === 'Origin').map((feat) => feat.name);
  return {
    intent: input.intent.trim(),
    actor: {
      actorId: input.character.id,
      isCompleted: input.character.isCompleted,
      name: input.character.name,
      level: input.character.level,
      speciesName: input.character.race,
      backgroundName: input.character.background,
      className: input.character.jobClass,
      originFeatNames: input.character.feats.filter((name) => originFeatNames.includes(name)),
      pointBuy: Object.fromEntries(ATTRS.map((attribute) => [
        attribute,
        input.character.attrs[attribute].base + input.character.attrs[attribute].pointbuy,
      ])) as DndPointBuyScores,
      description: input.character.description,
      appearanceDescription: input.character.appearanceDescription ?? '',
    },
    options: {
      classes: input.classes.map((item) => item.name),
      backgrounds: input.backgrounds.map((item) => item.name),
      originFeats: originFeatNames,
    },
  };
}

function validPointBuy(scores: DndPointBuyScores): boolean {
  return ATTRS.every((attribute) => Number.isInteger(scores[attribute]) && POINT_BUY_COST[scores[attribute]] !== undefined)
    && ATTRS.reduce((total, attribute) => total + POINT_BUY_COST[scores[attribute]], 0) === 27;
}

function same(value: unknown, next: unknown): boolean {
  return JSON.stringify(value) === JSON.stringify(next);
}

export function buildDndCharacterAssistantPlan(input: {
  character: CharacterData;
  result: DndCharacterAssistantGatewayResult;
  classes: ClassDef[];
  backgrounds: BackgroundDef[];
  feats: FeatDef[];
}): DndCharacterAssistantPlan {
  const { character, result } = input;
  const patch = result.suggestion.patch;
  const issues: DndCharacterAssistantIssue[] = [];
  const changedFields: string[] = [];
  const structural = Boolean(patch.className || patch.backgroundName || patch.originFeatName || patch.pointBuy);
  if (character.isCompleted && structural) {
    issues.push({ code: 'completed-actor-structural-change', severity: 'blocker', message: '已完成角色只允许辅助修改姓名与叙事文本；职业、背景、专长和属性需在正式重构流程处理。' });
  }
  if (!character.isCompleted && character.level !== 1 && structural) {
    issues.push({ code: 'level-one-structure-required', severity: 'blocker', message: '结构化车卡建议当前只支持一级创建草稿。' });
  }

  const selectedClass = patch.className ? input.classes.find((item) => item.name === patch.className) : undefined;
  const selectedBackground = patch.backgroundName ? input.backgrounds.find((item) => item.name === patch.backgroundName) : undefined;
  const effectiveBackground = selectedBackground ?? input.backgrounds.find((item) => item.name === character.background);
  const originFeats = input.feats.filter((item) => item.category === 'Origin');
  const requestedOriginFeat = patch.originFeatName ?? selectedBackground?.originFeat;
  const selectedOriginFeat = requestedOriginFeat ? originFeats.find((item) => item.name === requestedOriginFeat) : undefined;
  if (patch.className && !selectedClass) issues.push({ code: 'unknown-class', severity: 'blocker', message: '建议中的职业不在当前可用资料内。' });
  if (patch.backgroundName && !selectedBackground) issues.push({ code: 'unknown-background', severity: 'blocker', message: '建议中的背景不在当前可用资料内。' });
  if (requestedOriginFeat && !selectedOriginFeat) issues.push({ code: 'unknown-origin-feat', severity: 'blocker', message: '建议中的起源专长不在当前可用资料内。' });
  if (patch.originFeatName && effectiveBackground?.originFeat && patch.originFeatName !== effectiveBackground.originFeat) {
    issues.push({ code: 'background-feat-conflict', severity: 'blocker', message: '建议专长与当前背景声明的起源专长冲突。' });
  }
  if (patch.pointBuy && !validPointBuy(patch.pointBuy)) {
    issues.push({ code: 'invalid-point-buy', severity: 'blocker', message: '建议属性不是合法的 27 点购点方案。' });
  }

  let next: CharacterData = { ...character };
  if (patch.name && patch.name !== character.name) { next = { ...next, name: patch.name }; changedFields.push('姓名'); }
  if (patch.description && patch.description !== character.description) { next = { ...next, description: patch.description }; changedFields.push('角色描述'); }
  if (patch.appearanceDescription && patch.appearanceDescription !== (character.appearanceDescription ?? '')) {
    next = { ...next, appearanceDescription: patch.appearanceDescription };
    changedFields.push('外貌');
  }
  if (!character.isCompleted && selectedClass && selectedClass.name !== character.jobClass) {
    next = {
      ...next,
      jobClass: selectedClass.name,
      subclass: '',
      level: 1,
      hitDiceCurrent: 1,
      classLevels: [{ className: selectedClass.name, classId: selectedClass.id, level: 1 }],
    };
    changedFields.push('职业');
  }
  if (!character.isCompleted && selectedBackground && selectedBackground.name !== character.background) {
    next = { ...next, background: selectedBackground.name };
    changedFields.push('背景');
  }
  if (!character.isCompleted && selectedOriginFeat) {
    const originNames = new Set(originFeats.map((item) => item.name));
    const nextFeats = [...character.feats.filter((name) => !originNames.has(name)), selectedOriginFeat.name];
    if (!same(nextFeats, character.feats)) {
      next = { ...next, feats: nextFeats };
      changedFields.push('起源专长');
    }
  }
  if (!character.isCompleted && patch.pointBuy && validPointBuy(patch.pointBuy)) {
    const attrs = { ...next.attrs };
    ATTRS.forEach((attribute) => {
      attrs[attribute] = { ...attrs[attribute], pointbuy: patch.pointBuy![attribute] - attrs[attribute].base };
    });
    if (!same(attrs, character.attrs)) { next = { ...next, attrs, remainingPoints: 0 }; changedFields.push('属性购点'); }
  }
  if (changedFields.length === 0) issues.push({ code: 'no-applicable-changes', severity: 'blocker', message: '这条建议没有产生可确认的角色变更。' });

  const ready = !issues.some((issue) => issue.severity === 'blocker');
  return {
    suggestionId: result.suggestionId,
    provider: result.provider,
    model: result.model,
    summary: result.suggestion.summary,
    rationale: result.suggestion.rationale,
    modelWarnings: result.suggestion.warnings,
    actorId: character.id,
    baseFingerprint: JSON.stringify(character),
    createdAt: result.createdAt,
    changedFields,
    issues,
    ready,
    nextCharacter: ready ? next : undefined,
  };
}

export function canUndoDndCharacterAssistantCommit(character: CharacterData, receipt: DndCharacterAssistantCommitReceipt | null | undefined): boolean {
  return Boolean(receipt && receipt.actorId === character.id && JSON.stringify(receipt.after) === JSON.stringify(character));
}
