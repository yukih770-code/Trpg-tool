import { readLocalModelGatewayConfig } from '../config/modelGatewayConfig.js';
import { createLocalOllamaProvider } from './localOllamaProvider.js';
import { createModelGateway, type ModelGateway } from './modelGateway.js';

export function createConfiguredModelGateway(
  env: Record<string, string | undefined>,
  options: { fetcher?: typeof fetch } = {},
): ModelGateway {
  const config = readLocalModelGatewayConfig(env);
  const provider = config.configured && config.baseUrl && config.model
    ? createLocalOllamaProvider({ baseUrl: config.baseUrl, model: config.model, fetcher: options.fetcher })
    : undefined;
  return createModelGateway({ provider, timeoutMs: config.timeoutMs });
}
