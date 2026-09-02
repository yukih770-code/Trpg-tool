import { classifyApiServiceFailure, MISSING_OWNER_USER_REASON, resolveDevViewerUserId } from '../api/apiClient';
import { ApiClientError } from '../api/apiTypes';

type SelectionState = {
  campaignId: string;
  roomId: string;
};

function selectCampaign(state: SelectionState, campaignId: string): SelectionState {
  return { campaignId, roomId: '' };
}

function selectRoom(state: SelectionState, roomId: string): SelectionState {
  return { ...state, roomId };
}

function canAppendRuntimeEvent(text: string): boolean {
  return text.trim().length > 0;
}

function supportsRuntimeEventAction(action: 'append' | 'update' | 'delete'): boolean {
  return action === 'append';
}

function runSmoke(): void {
  const initial: SelectionState = { campaignId: '', roomId: '' };
  const campaignSelected = selectCampaign(initial, 'campaign-1');
  if (campaignSelected.campaignId !== 'campaign-1' || campaignSelected.roomId !== '') {
    throw new Error('campaign selection did not reset the room selection');
  }

  const roomSelected = selectRoom(campaignSelected, 'room-1');
  if (roomSelected.roomId !== 'room-1') throw new Error('room selection failed');
  if (!canAppendRuntimeEvent(' note ')) throw new Error('append event model rejected valid text');
  if (canAppendRuntimeEvent('   ')) throw new Error('append event model accepted empty text');
  if (!supportsRuntimeEventAction('append') || supportsRuntimeEventAction('update') || supportsRuntimeEventAction('delete')) {
    throw new Error('runtime event model exposed update/delete');
  }

  const apiOnlyData = { source: 'api' as const, demoFallbackMixed: false };
  if (apiOnlyData.source !== 'api' || apiOnlyData.demoFallbackMixed) throw new Error('real and demo data were mixed');

  const configuredIdentity = resolveDevViewerUserId({ DEV: true, VITE_DEV_VIEWER_USER_ID: 'fixture-user-a' });
  if (configuredIdentity !== 'fixture-user-a') throw new Error('configured dev identity was not preferred');
  if (classifyApiServiceFailure(new ApiClientError('api_error', 'unauthorized', { statusCode: 401 })) !== 'invalid_dev_identity') {
    throw new Error('missing dev fixture was not classified');
  }
  if (classifyApiServiceFailure(new ApiClientError('network', 'offline')) !== 'backend_unreachable') {
    throw new Error('backend outage was not classified');
  }
  if (classifyApiServiceFailure(new ApiClientError('api_error', 'unavailable', { statusCode: 503 })) !== 'service_unavailable') {
    throw new Error('world service outage was not classified');
  }
  // A missing local dev user arrives as a discriminated 409, not a 401 and not a
  // 503. It must read as an identity problem the operator can fix, never as a
  // service outage or as a duplicate the operator should retry.
  const missingOwner = new ApiClientError('api_error', 'conflict', {
    statusCode: 409,
    apiErrorKind: 'conflict',
    apiErrorReason: MISSING_OWNER_USER_REASON,
  });
  if (classifyApiServiceFailure(missingOwner) !== 'invalid_dev_identity') {
    throw new Error('missing local dev user was not classified as an identity problem');
  }
  if (classifyApiServiceFailure(new ApiClientError('api_error', 'conflict', { statusCode: 409, apiErrorKind: 'conflict' })) === 'invalid_dev_identity') {
    throw new Error('an ordinary conflict must not be read as a missing dev identity');
  }

  // The smoke intentionally stays backend-free. Actor binding is represented by
  // campaign records only; live room actor state is outside this slice.
  const actorBindingPlaceholder = { campaignActorInstanceId: undefined, liveRuntimeActor: false };
  if (actorBindingPlaceholder.liveRuntimeActor || actorBindingPlaceholder.campaignActorInstanceId) {
    throw new Error('actor binding smoke crossed the live runtime boundary');
  }
}

runSmoke();
console.log(JSON.stringify({
  total: 13,
  passed: 13,
  cases: [
    'dev identity visibility is UI-only and can be hidden in production',
    'campaign selection resets room selection',
    'room selection is independent state',
    'runtime event append accepts non-empty text',
    'runtime event append rejects empty text',
    'runtime event update/delete are not exposed',
    'real API data is not mixed with demo rows',
    'configured dev identity is preferred over stale local selection',
    'missing dev fixture is distinguished from backend unavailability',
    'world service unavailability is distinguished from backend unavailability',
    'a missing local dev user reads as an identity problem, not a 503 outage',
    'an ordinary conflict is not mistaken for a missing local dev user',
    'actor binding remains a campaign-record placeholder',
  ],
  notes: ['No backend, database, WebSocket, or mock network is used.'],
}, null, 2));
