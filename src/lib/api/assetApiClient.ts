import { createApiClient, resolveApiBaseUrl, resolveDevViewerUserId, type ApiClientOptions } from './apiClient';
import type { MediaAssetSummary } from '../architecture/mediaAsset';
export type AssetViewContext = { baseUrl?: string; roomId?: string; memberId?: string };
/** Presentation only: persist the ID, never this resolved URL. */
export function assetContentUrl(assetId: string, context: AssetViewContext = {}): string {
  const query = new URLSearchParams();
  if (context.roomId) query.set('roomId', context.roomId);
  if (context.memberId) query.set('memberId', context.memberId);
  const devViewer = resolveDevViewerUserId();
  if (devViewer) query.set('devViewerUserId', devViewer);
  return (context.baseUrl ?? resolveApiBaseUrl()).replace(/\/+$/, '') + '/api/assets/' + encodeURIComponent(assetId) + '/content?' + query;
}
export function createAssetApiClient(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  return {
    list: () => client.request<MediaAssetSummary[]>('/api/assets'),
    upload: (file: File, kind: 'map' | 'image') => client.request<MediaAssetSummary>('/api/assets?' + new URLSearchParams({ title: file.name, kind }), {
      method: 'POST', headers: { 'Content-Type': file.type }, body: file,
    }),
  };
}
