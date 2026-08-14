import type { StructuredModelProvider, StructuredModelRequest } from './modelGateway.js';

type Fetcher = typeof fetch;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

async function json(response: Response): Promise<unknown> {
  if (!response.ok) throw new Error(`provider_http_${response.status}`);
  return response.json();
}

export function createLocalOllamaProvider(input: { baseUrl: string; model: string; fetcher?: Fetcher }): StructuredModelProvider {
  const fetcher = input.fetcher ?? fetch;
  return {
    id: 'ollama',
    model: input.model,
    async status(signal) {
      const value = record(await json(await fetcher(`${input.baseUrl}/api/tags`, { signal, headers: { Accept: 'application/json' } })));
      const models = Array.isArray(value?.models) ? value.models : [];
      const names = models.flatMap((item) => {
        const model = record(item);
        return [model?.name, model?.model].filter((name): name is string => typeof name === 'string');
      });
      return { reachable: true, modelAvailable: names.includes(input.model) };
    },
    async generate(request: StructuredModelRequest, signal) {
      const response = await fetcher(`${input.baseUrl}/api/chat`, {
        method: 'POST',
        signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          stream: false,
          format: request.schema,
          options: { temperature: 0.2 },
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.prompt },
          ],
        }),
      });
      const value = record(await json(response));
      const message = record(value?.message);
      if (typeof message?.content !== 'string') throw new Error('provider_missing_content');
      return JSON.parse(message.content) as unknown;
    },
  };
}
