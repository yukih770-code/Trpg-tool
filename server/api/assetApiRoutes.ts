import express, { type Express, type Request, type Response } from 'express';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { ASSET_UPLOAD_LIMIT, AssetError, type createPlatformAssets } from '../services/platformAssets.js';
import { okResponse } from './apiResponse.js';

export function registerAssetApiRoutes(app: Express, options: {
  assets: ReturnType<typeof createPlatformAssets>;
  viewer: (req: Request) => CurrentViewerContext;
  /** Must verify room membership and that this exact asset occurs in its viewer projection. */
  canReadRoomAsset: (req: Request, assetId: string) => boolean;
}) {
  const owner = (req: Request) => {
    const viewer = options.viewer(req);
    if (!viewer.isAuthenticated || !viewer.viewerUserId) throw new AssetError('authentication_required', 401);
    return viewer.viewerUserId;
  };
  const fail = (res: Response, error: unknown) => {
    const status = error instanceof AssetError ? error.status : 503;
    res.status(status).json({ ok: false, statusCode: status, error: { kind: status === 503 ? 'unavailable' : 'validation', message: error instanceof AssetError ? error.code : 'asset_unavailable' } });
  };
  app.get('/api/assets', async (req, res) => {
    try { res.json(okResponse(await options.assets.list(owner(req)))); }
    catch (error) { fail(res, error); }
  });
  app.post('/api/assets', (req, res, next) => {
    try { owner(req); next(); } catch (error) { fail(res, error); }
  }, express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: ASSET_UPLOAD_LIMIT }), async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body)) throw new AssetError('unsupported_image', 415);
      const title = typeof req.query.title === 'string' ? req.query.title : 'Image';
      res.status(201).json(okResponse(await options.assets.upload(owner(req), req.body, req.get('content-type')?.split(';')[0] ?? '', title, req.query.kind === 'map' ? 'map' : 'image')));
    } catch (error) { fail(res, error); }
  });
  app.get('/api/assets/:assetId/content', async (req, res) => {
    try {
      const viewerId = owner(req), asset = await options.assets.get(req.params.assetId);
      if (asset.ownerId !== viewerId && !options.canReadRoomAsset(req, asset.assetId)) throw new AssetError('asset_not_found', 404);
      const bytes = await options.assets.read(asset);
      res.set({ 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" }).send(bytes);
    } catch (error) { fail(res, error); }
  });
}
