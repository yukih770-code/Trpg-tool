/**
 * Cloud API Server boundary markers (v0, types only).
 *
 * AI-LANDMARK: CLOUD_API_SERVER_BOUNDARY_MARKERS_V0
 *
 * This module reserves the API Server boundary for future account, repository,
 * Workshop, asset, permission, and AI job APIs. It does not create an Express
 * app, routes, auth, persistence, storage, or deployment behavior.
 */
export const API_SERVER_BOUNDARY = {
    kind: 'api-server-boundary',
    responsibility: 'platform-http-api',
};
export { errorResponse, okResponse, } from './apiResponse.js';
export { createUserApiHandlers, defaultPostgresUserApiHandlers, } from './userApiHandlers.js';
