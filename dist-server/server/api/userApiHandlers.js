/**
 * Postgres User API handler skeleton (v0).
 *
 * These handlers are server-only composition pieces. They are not mounted as
 * public routes yet because authentication and permission boundaries do not
 * exist in this slice.
 */
import { createPostgresUserRepository, } from '../adapters/postgresUserRepository.js';
import { errorResponse, okResponse } from './apiResponse.js';
const PROFILE_VISIBILITIES = new Set([
    'private',
    'campaignOnly',
    'unlisted',
    'public',
]);
function readNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function isPlainRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function readOptionalString(value) {
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}
function readStringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'string');
}
function translateRepositoryError(error, requestId) {
    if (error.kind === 'not_found') {
        return errorResponse(404, { kind: 'not_found', message: 'User not found.' }, { requestId });
    }
    if (error.kind === 'conflict') {
        return errorResponse(409, { kind: 'conflict', message: 'User record conflict.' }, { requestId });
    }
    if (error.kind === 'not_configured' || error.kind === 'schema_missing' || error.kind === 'database_error') {
        return errorResponse(503, {
            kind: 'unavailable',
            message: 'User repository is unavailable.',
            retryable: error.retryable,
        }, { requestId });
    }
    return errorResponse(500, { kind: 'internal', message: 'User API request failed.' }, { requestId });
}
function requiredStringError(fieldName, requestId) {
    return errorResponse(400, { kind: 'bad_request', message: `${fieldName} must be a non-empty string.` }, { requestId });
}
function readProfilePayload(profile) {
    if (!isPlainRecord(profile)) {
        return errorResponse(400, { kind: 'validation', message: 'profile must be an object.' });
    }
    const userId = readNonEmptyString(profile.userId);
    const handle = readNonEmptyString(profile.handle);
    const displayName = readNonEmptyString(profile.displayName);
    if (!userId)
        return requiredStringError('profile.userId');
    if (!handle)
        return requiredStringError('profile.handle');
    if (!displayName)
        return requiredStringError('profile.displayName');
    const visibility = readNonEmptyString(profile.visibility);
    if (visibility !== undefined && !PROFILE_VISIBILITIES.has(visibility)) {
        return errorResponse(400, { kind: 'validation', message: 'profile.visibility is invalid.' });
    }
    return {
        userId,
        handle,
        displayName,
        bio: readOptionalString(profile.bio),
        avatarMediaAssetId: readOptionalString(profile.avatarMediaAssetId),
        bannerMediaAssetId: readOptionalString(profile.bannerMediaAssetId),
        tags: readStringArray(profile.tags),
        visibility: visibility ?? 'private',
        pinned: [],
        sectionVisibility: isPlainRecord(profile.sectionVisibility) ? profile.sectionVisibility : {},
    };
}
function isApiError(value) {
    return isPlainRecord(value) && value.ok === false;
}
async function unwrapRepositoryResult(result, requestId, notFoundMessage) {
    if (result.ok === false)
        return translateRepositoryError(result.error, requestId);
    if (result.value === null) {
        return errorResponse(404, { kind: 'not_found', message: notFoundMessage }, { requestId });
    }
    return okResponse(result.value, { requestId });
}
export function createUserApiHandlers(options = {}) {
    const userRepository = options.userRepository ?? createPostgresUserRepository();
    return {
        async getUserByIdHandler(input) {
            const userId = readNonEmptyString(input.userId);
            if (!userId)
                return requiredStringError('userId', input.requestId);
            return unwrapRepositoryResult(await userRepository.getUserById(userId), input.requestId, 'User not found.');
        },
        async getUserProfileHandler(input) {
            const userId = readNonEmptyString(input.userId);
            if (!userId)
                return requiredStringError('userId', input.requestId);
            return unwrapRepositoryResult(await userRepository.getUserProfile(userId), input.requestId, 'User profile not found.');
        },
        async getUserByIdentityHandler(input) {
            const providerKind = readNonEmptyString(input.providerKind);
            if (!providerKind)
                return requiredStringError('providerKind', input.requestId);
            const providerSubject = readNonEmptyString(input.providerSubject);
            if (!providerSubject)
                return requiredStringError('providerSubject', input.requestId);
            return unwrapRepositoryResult(await userRepository.getUserByIdentity(providerKind, providerSubject), input.requestId, 'User identity not found.');
        },
        async saveUserProfileHandler(input) {
            const profile = readProfilePayload(input.profile);
            if (isApiError(profile)) {
                return { ...profile, requestId: input.requestId };
            }
            const result = await userRepository.saveUserProfile(profile);
            if (result.ok === false)
                return translateRepositoryError(result.error, input.requestId);
            return okResponse(result.value, { requestId: input.requestId });
        },
    };
}
export const defaultPostgresUserApiHandlers = createUserApiHandlers();
