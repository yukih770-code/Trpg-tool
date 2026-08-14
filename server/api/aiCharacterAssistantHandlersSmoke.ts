import assert from 'node:assert/strict';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { ModelGateway } from '../ai/modelGateway.js';
import { createAiCharacterAssistantApiHandlers } from './aiCharacterAssistantHandlers.js';

const viewer: CurrentViewerContext = {
  viewerUserId: 'user-1', isAuthenticated: true, authTrustLevel: 'verified_session',
  isDevOnly: false, isServiceInternal: false, notes: [],
};
const gateway: ModelGateway = {
  status: async () => ({ configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'local-model', capabilities: ['structured-output', 'cancellation', 'timeout'] }),
  generateDndCharacterSuggestion: async () => ({
    suggestionId: 'suggestion-1', provider: 'ollama', route: 'local', model: 'local-model', createdAt: 1,
    suggestion: { version: 1, summary: '测试', rationale: [], patch: { name: '阿尔法' }, warnings: [] },
  }),
  generateRoomSessionSuggestion: async () => { throw new Error('not used'); },
};
const handlers = createAiCharacterAssistantApiHandlers({ gateway });
const status = await handlers.status({ viewer });
assert.equal(status.ok, true);
const unauthenticated = await handlers.status({ viewer: { ...viewer, viewerUserId: null, isAuthenticated: false } });
assert.equal(unauthenticated.statusCode, 401);
const invalid = await handlers.suggest({ viewer, body: { intent: '' } });
assert.equal(invalid.statusCode, 400);
const success = await handlers.suggest({ viewer, body: {
  intent: '补全角色',
  actor: {
    actorId: 'actor-1', isCompleted: false, name: '', level: 1, speciesName: '人类', backgroundName: '', className: '',
    originFeatNames: [], pointBuy: { Str: 8, Dex: 8, Con: 8, Int: 8, Wis: 8, Cha: 8 }, description: '', appearanceDescription: '',
  },
  options: { classes: ['战士'], backgrounds: ['士兵'], originFeats: ['警觉'] },
} });
assert.equal(success.ok, true);
if (success.ok) assert.equal((success.value as { suggestionId: string }).suggestionId, 'suggestion-1');

console.log('DND character assistant API handler smoke passed.');
