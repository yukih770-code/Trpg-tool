import type { RoomSessionAssistantSuggestionResult } from '../../src/lib/ai/sessionAssistantTypes.js';

export type StoredRoomSessionAssistantSuggestion = RoomSessionAssistantSuggestionResult & {
  roomId: string;
  memberId: string;
  viewerUserId: string;
  contextFingerprint: string;
  focus?: string;
};

export interface RoomSessionAssistantSuggestionRegistry {
  put(value: StoredRoomSessionAssistantSuggestion): void;
  get(input: { suggestionId: string; roomId: string; memberId: string; viewerUserId: string }):
    | { decision: 'ready'; value: StoredRoomSessionAssistantSuggestion }
    | { decision: 'not_found' | 'expired' | 'forbidden' };
  consume(suggestionId: string): boolean;
  size(): number;
}

export function createRoomSessionAssistantSuggestionRegistry(options: {
  now?: () => number;
  maxEntries?: number;
} = {}): RoomSessionAssistantSuggestionRegistry {
  const values = new Map<string, StoredRoomSessionAssistantSuggestion>();
  const now = options.now ?? Date.now;
  const maxEntries = Math.max(1, Math.min(options.maxEntries ?? 200, 1_000));

  const prune = () => {
    const current = now();
    for (const [id, value] of values) if (value.expiresAt <= current) values.delete(id);
    while (values.size >= maxEntries) {
      const oldest = values.keys().next().value as string | undefined;
      if (!oldest) break;
      values.delete(oldest);
    }
  };

  return {
    put(value) {
      values.delete(value.suggestionId);
      prune();
      values.set(value.suggestionId, value);
    },
    get(input) {
      const value = values.get(input.suggestionId);
      if (!value) return { decision: 'not_found' };
      if (value.expiresAt <= now()) {
        values.delete(input.suggestionId);
        return { decision: 'expired' };
      }
      if (value.roomId !== input.roomId || value.memberId !== input.memberId || value.viewerUserId !== input.viewerUserId) {
        return { decision: 'forbidden' };
      }
      return { decision: 'ready', value };
    },
    consume(suggestionId) {
      return values.delete(suggestionId);
    },
    size: () => values.size,
  };
}
