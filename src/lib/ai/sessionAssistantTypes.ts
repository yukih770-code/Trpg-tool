import type { RoomRuntimeLogEvent } from '../platform/roomRuntimeLogTypes.js';
import type { SavedCampaignArtifact } from './campaignArtifactAssistantTypes.js';

export type RoomSessionAssistantTask =
  | 'preparation'
  | 'in_session'
  | 'recap'
  | 'character_biography'
  | 'quest_log';
export type RoomSessionAssistantVisibility = 'hostOnly' | 'public';

export type RoomSessionAssistantSuggestion = {
  version: 1;
  task: RoomSessionAssistantTask;
  title: string;
  summary: string;
  highlights: string[];
  risks: string[];
  suggestedNextSteps: string[];
  hostDraft: string;
  publicDraft: string;
};

export type RoomSessionAssistantSuggestionResult = {
  suggestionId: string;
  task: RoomSessionAssistantTask;
  provider: 'ollama';
  route: 'local';
  model: string;
  createdAt: number;
  expiresAt: number;
  contextThroughSeq: number;
  artifactDestination?: {
    worldServerId: string;
    campaignId: string;
    runtimeSessionId: string;
    campaignDisplayName: string;
  };
  suggestion: RoomSessionAssistantSuggestion;
};

export type RoomSessionAssistantGenerateInput = {
  memberId: string;
  task: RoomSessionAssistantTask;
  focus?: string;
};

export type RoomSessionAssistantConfirmInput = {
  memberId: string;
  visibility: RoomSessionAssistantVisibility;
};

export type RoomSessionAssistantConfirmResult = {
  event: RoomRuntimeLogEvent;
  suggestionId: string;
};

export type RoomSessionAssistantSaveArtifactResult = {
  artifact: SavedCampaignArtifact;
  suggestionId: string;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : undefined;
}

function stringList(value: unknown, maxItems: number, maxText: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const result = value.map((item) => text(item, maxText));
  return result.some((item) => item === undefined) ? null : result as string[];
}

export function isRoomSessionAssistantTask(value: unknown): value is RoomSessionAssistantTask {
  return value === 'preparation'
    || value === 'in_session'
    || value === 'recap'
    || value === 'character_biography'
    || value === 'quest_log';
}

export function roomSessionAssistantTaskRequiresFocus(task: RoomSessionAssistantTask): boolean {
  return task === 'character_biography';
}

export function selectRoomSessionAssistantDraft(
  suggestion: RoomSessionAssistantSuggestion,
  visibility: RoomSessionAssistantVisibility,
): string {
  return visibility === 'public' ? suggestion.publicDraft : suggestion.hostDraft;
}

export function parseRoomSessionAssistantSuggestion(value: unknown): RoomSessionAssistantSuggestion | null {
  const source = record(value);
  if (!source || source.version !== 1 || !isRoomSessionAssistantTask(source.task)) return null;
  const title = text(source.title, 160);
  const summary = text(source.summary, 2_000);
  const highlights = stringList(source.highlights, 8, 500);
  const risks = stringList(source.risks, 6, 500);
  const suggestedNextSteps = stringList(source.suggestedNextSteps, 6, 500);
  const hostDraft = text(source.hostDraft, 4_000);
  const publicDraft = text(source.publicDraft, 3_000);
  if (!title || !summary || !highlights || !risks || !suggestedNextSteps || !hostDraft || !publicDraft) return null;
  return { version: 1, task: source.task, title, summary, highlights, risks, suggestedNextSteps, hostDraft, publicDraft };
}

const taskEnum: RoomSessionAssistantTask[] = ['preparation', 'in_session', 'recap', 'character_biography', 'quest_log'];

export const ROOM_SESSION_ASSISTANT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'task', 'title', 'summary', 'highlights', 'risks', 'suggestedNextSteps', 'hostDraft', 'publicDraft'],
  properties: {
    version: { type: 'integer', const: 1 },
    task: { type: 'string', enum: taskEnum },
    title: { type: 'string', minLength: 1, maxLength: 160 },
    summary: { type: 'string', minLength: 1, maxLength: 2_000 },
    highlights: { type: 'array', maxItems: 8, items: { type: 'string', minLength: 1, maxLength: 500 } },
    risks: { type: 'array', maxItems: 6, items: { type: 'string', minLength: 1, maxLength: 500 } },
    suggestedNextSteps: { type: 'array', maxItems: 6, items: { type: 'string', minLength: 1, maxLength: 500 } },
    hostDraft: { type: 'string', minLength: 1, maxLength: 4_000 },
    publicDraft: { type: 'string', minLength: 1, maxLength: 3_000 },
  },
} as const;
