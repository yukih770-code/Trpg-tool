import type { AiModelCapability, AiRouteMode } from './modelRoutingTypes.js';

export type DndAssistantAttributeName = 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';
export type DndPointBuyScores = Record<DndAssistantAttributeName, number>;

export type DndCharacterAssistantSuggestion = {
  version: 1;
  summary: string;
  rationale: string[];
  patch: {
    name?: string;
    className?: string;
    backgroundName?: string;
    originFeatName?: string;
    pointBuy?: DndPointBuyScores;
    description?: string;
    appearanceDescription?: string;
  };
  warnings: string[];
};

export type DndCharacterAssistantRequest = {
  intent: string;
  actor: {
    actorId: string;
    isCompleted: boolean;
    name: string;
    level: number;
    speciesName: string;
    backgroundName: string;
    className: string;
    originFeatNames: string[];
    pointBuy: DndPointBuyScores;
    description: string;
    appearanceDescription: string;
  };
  options: {
    classes: string[];
    backgrounds: string[];
    originFeats: string[];
  };
};

export type AiModelGatewayStatus = {
  configured: boolean;
  reachable: boolean;
  provider: 'ollama' | 'disabled';
  route: AiRouteMode;
  model?: string;
  capabilities: AiModelCapability[];
  reason?: 'not-configured' | 'provider-unreachable' | 'model-unavailable' | 'user-disabled' | 'route-unavailable';
};

export type DndCharacterAssistantGatewayResult = {
  suggestionId: string;
  provider: 'ollama';
  route: 'local';
  model: string;
  createdAt: number;
  suggestion: DndCharacterAssistantSuggestion;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function boundedText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text && text.length <= max ? text : undefined;
}

function optionalText(source: JsonRecord, key: string, max: number): string | undefined | null {
  if (!(key in source) || source[key] === undefined || source[key] === null) return undefined;
  return boundedText(source[key], max) ?? null;
}

const ATTRIBUTES: DndAssistantAttributeName[] = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];

export function parseDndCharacterAssistantSuggestion(value: unknown): DndCharacterAssistantSuggestion | null {
  const source = record(value);
  const patchSource = record(source?.patch);
  if (!source || source.version !== 1 || !patchSource) return null;
  const summary = boundedText(source.summary, 500);
  if (!summary) return null;
  if (
    !Array.isArray(source.rationale) ||
    !Array.isArray(source.warnings) ||
    source.rationale.length > 8 ||
    source.warnings.length > 8
  ) return null;
  const rationale = source.rationale.map((item) => boundedText(item, 500));
  const warnings = source.warnings.map((item) => boundedText(item, 500));
  if (rationale.some((item) => item === undefined) || warnings.some((item) => item === undefined)) return null;

  const name = optionalText(patchSource, 'name', 80);
  const className = optionalText(patchSource, 'className', 80);
  const backgroundName = optionalText(patchSource, 'backgroundName', 80);
  const originFeatName = optionalText(patchSource, 'originFeatName', 80);
  const description = optionalText(patchSource, 'description', 2000);
  const appearanceDescription = optionalText(patchSource, 'appearanceDescription', 1000);
  if ([name, className, backgroundName, originFeatName, description, appearanceDescription].some((item) => item === null)) return null;

  let pointBuy: DndPointBuyScores | undefined;
  if (patchSource.pointBuy !== undefined && patchSource.pointBuy !== null) {
    const values = record(patchSource.pointBuy);
    if (!values || !ATTRIBUTES.every((attribute) => Number.isInteger(values[attribute]))) return null;
    pointBuy = Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute, Number(values[attribute])])) as DndPointBuyScores;
  }

  return {
    version: 1,
    summary,
    rationale: rationale as string[],
    patch: {
      ...(name ? { name } : {}),
      ...(className ? { className } : {}),
      ...(backgroundName ? { backgroundName } : {}),
      ...(originFeatName ? { originFeatName } : {}),
      ...(pointBuy ? { pointBuy } : {}),
      ...(description ? { description } : {}),
      ...(appearanceDescription ? { appearanceDescription } : {}),
    },
    warnings: warnings as string[],
  };
}

export const DND_CHARACTER_ASSISTANT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'summary', 'rationale', 'patch', 'warnings'],
  properties: {
    version: { type: 'integer', const: 1 },
    summary: { type: 'string', maxLength: 500 },
    rationale: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 500 } },
    patch: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', maxLength: 80 },
        className: { type: 'string', maxLength: 80 },
        backgroundName: { type: 'string', maxLength: 80 },
        originFeatName: { type: 'string', maxLength: 80 },
        pointBuy: {
          type: 'object',
          additionalProperties: false,
          required: ATTRIBUTES,
          properties: Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute, { type: 'integer', minimum: 8, maximum: 15 }])),
        },
        description: { type: 'string', maxLength: 2000 },
        appearanceDescription: { type: 'string', maxLength: 1000 },
      },
    },
    warnings: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 500 } },
  },
} as const;
