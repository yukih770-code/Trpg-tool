import { createApiClient, type ApiClientOptions } from './apiClient';
import type {
  AiModelGatewayStatus,
  DndCharacterAssistantGatewayResult,
  DndCharacterAssistantRequest,
} from '../ai/dndCharacterAssistantTypes';
import type { AiModelCatalog } from '../ai/modelRoutingTypes';
import type {
  DndPersonalContentAssistantGatewayResult,
  DndPersonalContentAssistantRequest,
} from '../ai/dndPersonalContentAssistantTypes';
import { currentAiRoutingHeaders } from '../ai/modelRoutingPreference';

export type AiModelGatewayApiClient = {
  catalog(refresh?: boolean, signal?: AbortSignal): Promise<AiModelCatalog>;
  status(signal?: AbortSignal): Promise<AiModelGatewayStatus>;
  suggestDndCharacter(input: DndCharacterAssistantRequest, signal?: AbortSignal): Promise<DndCharacterAssistantGatewayResult>;
  suggestDndPersonalContent(input: DndPersonalContentAssistantRequest, signal?: AbortSignal): Promise<DndPersonalContentAssistantGatewayResult>;
};

export function createAiModelGatewayApiClient(options: ApiClientOptions = {}): AiModelGatewayApiClient {
  const client = createApiClient(options);
  return {
    catalog: (refresh = false, signal) => client.request(`/api/ai/model-gateway/catalog${refresh ? '?refresh=1' : ''}`, { signal }),
    status: (signal) => client.request('/api/ai/model-gateway/status', { signal, headers: currentAiRoutingHeaders() }),
    suggestDndCharacter: (input, signal) => client.request('/api/ai/dnd-character-assistant/suggest', {
      method: 'POST',
      signal,
      headers: currentAiRoutingHeaders(),
      body: JSON.stringify(input),
    }),
    suggestDndPersonalContent: (input, signal) => client.request('/api/ai/dnd-personal-content-assistant/suggest', {
      method: 'POST',
      signal,
      headers: currentAiRoutingHeaders(),
      body: JSON.stringify(input),
    }),
  };
}

export const aiModelGatewayApiClient = createAiModelGatewayApiClient();
