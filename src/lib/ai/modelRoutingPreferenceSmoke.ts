import assert from 'node:assert/strict';
import { resolveAiSettingsAvailability } from './aiSettingsPresentation';
import {
  AI_LOCAL_MODEL_HEADER,
  AI_ROUTE_MODE_HEADER,
  aiRoutingPreferenceHeaders,
  parseAiRoutingPreference,
  parseAiRoutingPreferenceHeaders,
  type AiModelCatalog,
} from './modelRoutingTypes';
import {
  AI_ROUTING_PREFERENCE_STORAGE_KEY,
  readAiRoutingPreference,
  writeAiRoutingPreference,
} from './modelRoutingPreference';

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
};

assert.deepEqual(parseAiRoutingPreference(null), { mode: 'auto' });
assert.deepEqual(parseAiRoutingPreference({ mode: 'local', localModel: '../bad model' }), { mode: 'local' });
assert.deepEqual(writeAiRoutingPreference({ mode: 'local', localModel: 'qwen3.6:27b' }, storage), { mode: 'local', localModel: 'qwen3.6:27b' });
assert.deepEqual(readAiRoutingPreference(storage), { mode: 'local', localModel: 'qwen3.6:27b' });
assert.ok(values.has(AI_ROUTING_PREFERENCE_STORAGE_KEY));
assert.deepEqual(aiRoutingPreferenceHeaders({ mode: 'off' }), { [AI_ROUTE_MODE_HEADER]: 'off' });
assert.deepEqual(parseAiRoutingPreferenceHeaders({ [AI_ROUTE_MODE_HEADER]: 'local', [AI_LOCAL_MODEL_HEADER]: 'qwen3.6:27b' }), { mode: 'local', localModel: 'qwen3.6:27b' });

const baseCatalog: AiModelCatalog = {
  local: { configured: true, reachable: true },
  cloud: { configured: false, reason: 'not-implemented' },
  models: [{ id: 'qwen3.6:27b', provider: 'ollama', route: 'local', installed: true, recommended: true, capabilities: [] }],
  refreshedAt: 1,
};
assert.equal(resolveAiSettingsAvailability({ loading: true, error: '', catalog: null }), 'loading');
assert.equal(resolveAiSettingsAvailability({ loading: false, error: 'failed', catalog: null }), 'error');
assert.equal(resolveAiSettingsAvailability({ loading: false, error: '', catalog: { ...baseCatalog, local: { configured: false, reachable: false, reason: 'not-configured' } } }), 'not-configured');
assert.equal(resolveAiSettingsAvailability({ loading: false, error: '', catalog: { ...baseCatalog, local: { configured: true, reachable: false, reason: 'provider-unreachable' } } }), 'unreachable');
assert.equal(resolveAiSettingsAvailability({ loading: false, error: '', catalog: { ...baseCatalog, models: [] } }), 'empty');
assert.equal(resolveAiSettingsAvailability({ loading: false, error: '', catalog: baseCatalog }), 'ready');

console.log('AI routing preference and settings presentation smoke passed.');
