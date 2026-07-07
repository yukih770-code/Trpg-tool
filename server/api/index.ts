/**
 * Cloud API Server boundary markers (v0, types only).
 *
 * AI-LANDMARK: CLOUD_API_SERVER_BOUNDARY_MARKERS_V0
 *
 * This module reserves the API Server boundary for future account, repository,
 * Workshop, asset, permission, and AI job APIs. It does not create an Express
 * app, routes, auth, persistence, storage, or deployment behavior.
 */

export interface ApiServerBoundary {
  readonly kind: 'api-server-boundary';
  readonly responsibility: 'platform-http-api';
}

export const API_SERVER_BOUNDARY: ApiServerBoundary = {
  kind: 'api-server-boundary',
  responsibility: 'platform-http-api',
};

export type {
  ServerApiError,
  ServerApiErrorKind,
  ServerApiResponse,
} from './apiResponse.js';
export {
  errorResponse,
  okResponse,
} from './apiResponse.js';
export type {
  CreateUserApiHandlersOptions,
  GetUserByIdHandlerInput,
  GetUserByIdentityHandlerInput,
  GetUserProfileHandlerInput,
  SaveUserProfileHandlerInput,
  UserApiHandlers,
  UserApiRequestContext,
} from './userApiHandlers.js';
export {
  createUserApiHandlers,
  defaultPostgresUserApiHandlers,
} from './userApiHandlers.js';
