import { createApiClient, type ApiClientOptions } from '../api/apiClient';
import type { AiModelGatewayStatus } from '../ai/dndCharacterAssistantTypes';
import { currentAiRoutingHeaders } from '../ai/modelRoutingPreference';
import type {
  RoomSessionAssistantConfirmResult,
  RoomSessionAssistantGenerateInput,
  RoomSessionAssistantSuggestionResult,
  RoomSessionAssistantSaveArtifactResult,
  RoomSessionAssistantVisibility,
} from '../ai/sessionAssistantTypes';

export type RoomSessionAssistantHttpClient = {
  status(roomId: string, memberId: string, signal?: AbortSignal): Promise<AiModelGatewayStatus>;
  generate(roomId: string, input: RoomSessionAssistantGenerateInput, signal?: AbortSignal): Promise<RoomSessionAssistantSuggestionResult>;
  confirm(roomId: string, suggestionId: string, memberId: string, visibility: RoomSessionAssistantVisibility): Promise<RoomSessionAssistantConfirmResult>;
  saveArtifact(roomId: string, suggestionId: string, memberId: string): Promise<RoomSessionAssistantSaveArtifactResult>;
};

export function createRoomSessionAssistantHttpClient(options: ApiClientOptions = {}): RoomSessionAssistantHttpClient {
  const client = createApiClient(options);
  return {
    status: (roomId, memberId, signal) => {
      const query = new URLSearchParams({ memberId });
      return client.request(`/api/ai/rooms/${encodeURIComponent(roomId)}/session-assistant/status?${query}`, { signal, headers: currentAiRoutingHeaders() });
    },
    generate: (roomId, input, signal) => client.request(`/api/ai/rooms/${encodeURIComponent(roomId)}/session-assistant/suggestions`, {
      method: 'POST',
      signal,
      headers: currentAiRoutingHeaders(),
      body: JSON.stringify(input),
    }),
    confirm: (roomId, suggestionId, memberId, visibility) => client.request(`/api/ai/rooms/${encodeURIComponent(roomId)}/session-assistant/suggestions/${encodeURIComponent(suggestionId)}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ memberId, visibility }),
    }),
    saveArtifact: (roomId, suggestionId, memberId) => client.request(`/api/ai/rooms/${encodeURIComponent(roomId)}/session-assistant/suggestions/${encodeURIComponent(suggestionId)}/save-artifact`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    }),
  };
}
