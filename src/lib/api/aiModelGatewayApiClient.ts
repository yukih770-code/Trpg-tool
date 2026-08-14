import { createApiClient, type ApiClientOptions } from './apiClient';
import type {
  AiModelGatewayStatus,
  DndCharacterAssistantGatewayResult,
  DndCharacterAssistantRequest,
} from '../ai/dndCharacterAssistantTypes';

export type AiModelGatewayApiClient = {
  status(signal?: AbortSignal): Promise<AiModelGatewayStatus>;
  suggestDndCharacter(input: DndCharacterAssistantRequest, signal?: AbortSignal): Promise<DndCharacterAssistantGatewayResult>;
};

export function createAiModelGatewayApiClient(options: ApiClientOptions = {}): AiModelGatewayApiClient {
  const client = createApiClient(options);
  return {
    status: (signal) => client.request('/api/ai/model-gateway/status', { signal }),
    suggestDndCharacter: (input, signal) => client.request('/api/ai/dnd-character-assistant/suggest', {
      method: 'POST',
      signal,
      body: JSON.stringify(input),
    }),
  };
}

export const aiModelGatewayApiClient = createAiModelGatewayApiClient();
