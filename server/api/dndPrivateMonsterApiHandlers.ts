import { randomUUID } from 'node:crypto';

import { createPostgresDndPrivateMonsterRepository, type PostgresDndPrivateMonsterRepository } from '../adapters/postgresDndPrivateMonsterRepository.js';
import { createPostgresWorldServerRepository, type PostgresWorldServerRepository, type WorldServerMembershipRecord, type WorldServerRecord } from '../adapters/postgresWorldServerRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { resolveApiPermissionGuard } from './apiPermissionGuard.js';
import { resolveApiRequestScope } from './apiRequestContext.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';
import type { DndPrivateMonsterTemplate } from '../../src/lib/dnd/dndMonsterTemplateTypes.js';

type ApiResult = ServerApiResponse<unknown>;
type MonsterRepository = Pick<PostgresDndPrivateMonsterRepository, 'listPrivateMonsterTemplates' | 'getPrivateMonsterTemplate' | 'createPrivateMonsterTemplate' | 'updatePrivateMonsterTemplate' | 'archivePrivateMonsterTemplate'>;
type WorldRepository = Pick<PostgresWorldServerRepository, 'getWorldServerById' | 'getWorldServerMembershipByUser'>;
export type DndPrivateMonsterApiRequest = { requestId?: string; params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown; headers?: Record<string, string | string[] | undefined>; viewer?: CurrentViewerContext };
export type DndPrivateMonsterApiHandlers = { listMonsters(input: DndPrivateMonsterApiRequest): Promise<ApiResult>; getMonster(input: DndPrivateMonsterApiRequest): Promise<ApiResult>; createMonster(input: DndPrivateMonsterApiRequest): Promise<ApiResult>; updateMonster(input: DndPrivateMonsterApiRequest): Promise<ApiResult>; archiveMonster(input: DndPrivateMonsterApiRequest): Promise<ApiResult> };

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const array = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
const id = (input: DndPrivateMonsterApiRequest, key: string) => text(input.params?.[key]);
const responseIs = (value: unknown): value is ApiResult => typeof value === 'object' && value !== null && 'statusCode' in value && 'ok' in value;
const roleKind = (key: string): 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'custom' => key === 'owner' ? 'owner' : key === 'admin' || key === 'administrator' ? 'admin' : key === 'moderator' ? 'moderator' : key === 'member' ? 'member' : key === 'guest' ? 'guest' : 'custom';
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `monster-${randomUUID().slice(0, 8)}`;

function repoFailure(error: { kind: string; retryable?: boolean }, requestId?: string): ApiResult {
  if (error.kind === 'not_found') return errorResponse(404, { kind: 'not_found', message: 'Private monster not found.' }, { requestId });
  if (error.kind === 'conflict') return errorResponse(409, { kind: 'conflict', message: 'A private monster with this name already exists.' }, { requestId });
  return errorResponse(503, { kind: 'unavailable', message: 'Private monster service is unavailable.', retryable: error.retryable }, { requestId });
}
function viewerFor(input: DndPrivateMonsterApiRequest, options: CreateDndPrivateMonsterApiHandlersOptions): CurrentViewerContext {
  return input.viewer ?? createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: input.headers } as ApiRequestLike, { allowDevAuthHeaders: options.allowDevAuthHeaders === true, nodeEnv: options.nodeEnv ?? 'production' }));
}
function privatePayload(value: Record<string, unknown>): Pick<DndPrivateMonsterTemplate, 'speed' | 'abilities' | 'savingThrows' | 'skills' | 'senses' | 'traits' | 'actions' | 'reactions' | 'legendaryActions' | 'spellcasting' | 'tags'> {
  return { speed: record(value.speed), abilities: record(value.abilities) as DndPrivateMonsterTemplate['abilities'], savingThrows: record(value.savingThrows) as DndPrivateMonsterTemplate['savingThrows'], skills: record(value.skills) as DndPrivateMonsterTemplate['skills'], senses: record(value.senses), traits: array(value.traits), actions: array(value.actions), reactions: array(value.reactions), legendaryActions: array(value.legendaryActions), spellcasting: Object.keys(record(value.spellcasting)).length ? record(value.spellcasting) : undefined, tags: array<string>(value.tags).filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 30) };
}
function partialPrivatePayload(value: Record<string, unknown>): Partial<Pick<DndPrivateMonsterTemplate, 'speed' | 'abilities' | 'savingThrows' | 'skills' | 'senses' | 'traits' | 'actions' | 'reactions' | 'legendaryActions' | 'spellcasting' | 'tags'>> {
  const next: Partial<Pick<DndPrivateMonsterTemplate, 'speed' | 'abilities' | 'savingThrows' | 'skills' | 'senses' | 'traits' | 'actions' | 'reactions' | 'legendaryActions' | 'spellcasting' | 'tags'>> = {};
  if ('speed' in value) next.speed = record(value.speed);
  if ('abilities' in value) next.abilities = record(value.abilities) as DndPrivateMonsterTemplate['abilities'];
  if ('savingThrows' in value) next.savingThrows = record(value.savingThrows) as DndPrivateMonsterTemplate['savingThrows'];
  if ('skills' in value) next.skills = record(value.skills) as DndPrivateMonsterTemplate['skills'];
  if ('senses' in value) next.senses = record(value.senses);
  if ('traits' in value) next.traits = array(value.traits);
  if ('actions' in value) next.actions = array(value.actions);
  if ('reactions' in value) next.reactions = array(value.reactions);
  if ('legendaryActions' in value) next.legendaryActions = array(value.legendaryActions);
  if ('spellcasting' in value) next.spellcasting = Object.keys(record(value.spellcasting)).length ? record(value.spellcasting) : undefined;
  if ('tags' in value) next.tags = array<string>(value.tags).filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 30);
  return next;
}

export type CreateDndPrivateMonsterApiHandlersOptions = { monsterRepository?: MonsterRepository; worldRepository?: WorldRepository; allowDevAuthHeaders?: boolean; nodeEnv?: string };
export function createDndPrivateMonsterApiHandlers(options: CreateDndPrivateMonsterApiHandlersOptions = {}): DndPrivateMonsterApiHandlers {
  const monsters = options.monsterRepository ?? createPostgresDndPrivateMonsterRepository();
  const worlds = options.worldRepository ?? createPostgresWorldServerRepository();
  async function authorize(input: DndPrivateMonsterApiRequest, action: 'view' | 'manageServerSettings'): Promise<{ viewer: CurrentViewerContext; server: WorldServerRecord; membership: WorldServerMembershipRecord | null } | ApiResult> {
    const viewer = viewerFor(input, options); const requestId = input.requestId;
    if (!viewer.isAuthenticated || !viewer.viewerUserId) return errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId });
    const scope = resolveApiRequestScope({ params: input.params, query: input.query, body: record(input.body), headers: input.headers });
    if (!scope.safe) return errorResponse(400, { kind: 'bad_request', message: 'Request scope is inconsistent.' }, { requestId });
    const worldServerId = id(input, 'worldServerId') ?? scope.scope.worldServerId;
    if (!worldServerId) return errorResponse(400, { kind: 'validation', message: 'worldServerId is required.' }, { requestId });
    const serverResult = await worlds.getWorldServerById(worldServerId);
    if (serverResult.ok === false) return repoFailure(serverResult.error, requestId);
    if (!serverResult.value) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId });
    const server = serverResult.value;
    let membership: WorldServerMembershipRecord | null = null;
    if (server.ownerId !== viewer.viewerUserId) { const memberResult = await worlds.getWorldServerMembershipByUser(worldServerId, viewer.viewerUserId); if (memberResult.ok === false) return repoFailure(memberResult.error, requestId); membership = memberResult.value; }
    const guard = resolveApiPermissionGuard({ action, viewer, requestScope: scope, content: action === 'view' ? { contentKind: 'world_server', contentId: server.worldServerId, ownerUserId: server.ownerId, worldServerId, visibilityScope: 'server', aiScope: 'disabled', lifecycleStatus: server.lifecycleStatus } : undefined, worldServer: { worldServerId, ownerUserId: server.ownerId, membership: membership ? { userId: membership.userId, membershipStatus: membership.membershipStatus as 'active', roleKey: membership.roleKey, roleKind: roleKind(membership.roleKey), permissionsPayload: membership.payload } : null }, hideResourceExistence: action === 'view', resourceExistenceKnown: true });
    if (!guard.allowed) return errorResponse(guard.httpStatus, { kind: guard.httpStatus === 404 ? 'not_found' : 'bad_request', message: guard.publicMessage ?? 'You do not have access to this resource.' }, { requestId });
    return { viewer, server, membership };
  }
  async function ownMonster(input: DndPrivateMonsterApiRequest, action: 'view' | 'manageServerSettings') {
    const access = await authorize(input, action); if (responseIs(access)) return access;
    const monsterId = id(input, 'monsterTemplateId'); if (!monsterId) return errorResponse(400, { kind: 'validation', message: 'monsterTemplateId is required.' }, { requestId: input.requestId });
    const found = await monsters.getPrivateMonsterTemplate(monsterId); if (found.ok === false) return repoFailure(found.error, input.requestId); if (!found.value || found.value.worldServerId !== access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'Private monster not found.' }, { requestId: input.requestId });
    return { access, monster: found.value };
  }
  return {
    async listMonsters(input) { const access = await authorize(input, 'view'); if (responseIs(access)) return access; const result = await monsters.listPrivateMonsterTemplates(access.server.worldServerId, { search: text(input.query?.search), creatureType: text(input.query?.creatureType), challengeRating: text(input.query?.challengeRating), tag: text(input.query?.tag), includeArchived: input.query?.includeArchived === 'true', limit: number(input.query?.limit) }); return result.ok === false ? repoFailure(result.error, input.requestId) : okResponse(result.value, { requestId: input.requestId }); },
    async getMonster(input) { const result = await ownMonster(input, 'view'); return responseIs(result) ? result : okResponse(result.monster, { requestId: input.requestId }); },
    async createMonster(input) { const access = await authorize(input, 'manageServerSettings'); if (responseIs(access)) return access; const body = record(input.body); const name = text(body.name); if (!name) return errorResponse(400, { kind: 'validation', message: 'name is required.' }, { requestId: input.requestId }); const result = await monsters.createPrivateMonsterTemplate({ monsterTemplateId: randomUUID(), worldServerId: access.server.worldServerId, createdByUserId: access.viewer.viewerUserId ?? undefined, name, slug: slugify(text(body.slug) ?? name), size: text(body.size), creatureType: text(body.creatureType), alignment: text(body.alignment), armorClass: number(body.armorClass), hitPointsAverage: number(body.hitPointsAverage), hitPointsFormula: text(body.hitPointsFormula), languages: text(body.languages), challengeRating: text(body.challengeRating), proficiencyBonus: number(body.proficiencyBonus), sourceFormat: text(body.sourceFormat) ?? 'manual', sourceHash: text(body.sourceHash), visibility: 'private', schemaVersion: 1, ...privatePayload(body) }); return result.ok === false ? repoFailure(result.error, input.requestId) : okResponse(result.value, { statusCode: 201, requestId: input.requestId }); },
    async updateMonster(input) { const target = await ownMonster(input, 'manageServerSettings'); if (responseIs(target)) return target; const body = record(input.body); const result = await monsters.updatePrivateMonsterTemplate({ monsterTemplateId: target.monster.monsterTemplateId, name: text(body.name), slug: text(body.slug) ? slugify(text(body.slug)!) : undefined, size: text(body.size), creatureType: text(body.creatureType), alignment: text(body.alignment), armorClass: number(body.armorClass), hitPointsAverage: number(body.hitPointsAverage), hitPointsFormula: text(body.hitPointsFormula), languages: text(body.languages), challengeRating: text(body.challengeRating), proficiencyBonus: number(body.proficiencyBonus), ...partialPrivatePayload(body) }); if (result.ok === false) return repoFailure(result.error, input.requestId); return result.value ? okResponse(result.value, { requestId: input.requestId }) : errorResponse(404, { kind: 'not_found', message: 'Private monster not found.' }, { requestId: input.requestId }); },
    async archiveMonster(input) { const target = await ownMonster(input, 'manageServerSettings'); if (responseIs(target)) return target; const result = await monsters.archivePrivateMonsterTemplate(target.monster.monsterTemplateId); if (result.ok === false) return repoFailure(result.error, input.requestId); return result.value ? okResponse(result.value, { requestId: input.requestId }) : errorResponse(404, { kind: 'not_found', message: 'Private monster not found.' }, { requestId: input.requestId }); },
  };
}
