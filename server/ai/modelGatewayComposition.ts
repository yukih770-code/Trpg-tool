import { readLocalModelGatewayConfig } from '../config/modelGatewayConfig.js';
import type { ModelGateway } from './modelGateway.js';
import { createRoutedLocalModelGateway } from './modelRoutingGateway.js';

export function createConfiguredModelGateway(
  env: Record<string, string | undefined>,
  options: { fetcher?: typeof fetch } = {},
): ModelGateway {
  const config = readLocalModelGatewayConfig(env);
  return createRoutedLocalModelGateway({ config, fetcher: options.fetcher });
}
