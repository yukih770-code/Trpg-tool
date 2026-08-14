import {
  aiRoutingPreferenceHeaders,
  parseAiRoutingPreference,
  type AiRoutingPreference,
} from './modelRoutingTypes';

export const AI_ROUTING_PREFERENCE_STORAGE_KEY = 'trpg-platform.ai-routing.v1';

export type AiPreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): AiPreferenceStorage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readAiRoutingPreference(storage: AiPreferenceStorage | undefined = browserStorage()): AiRoutingPreference {
  if (!storage) return { mode: 'auto' };
  try {
    const raw = storage.getItem(AI_ROUTING_PREFERENCE_STORAGE_KEY);
    return raw ? parseAiRoutingPreference(JSON.parse(raw) as unknown) : { mode: 'auto' };
  } catch {
    return { mode: 'auto' };
  }
}

export function writeAiRoutingPreference(
  preference: AiRoutingPreference,
  storage: AiPreferenceStorage | undefined = browserStorage(),
): AiRoutingPreference {
  const parsed = parseAiRoutingPreference(preference);
  try {
    storage?.setItem(AI_ROUTING_PREFERENCE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Device-local persistence is best-effort; the selected value still applies to this render.
  }
  return parsed;
}

export function currentAiRoutingHeaders(): Record<string, string> {
  return aiRoutingPreferenceHeaders(readAiRoutingPreference());
}
