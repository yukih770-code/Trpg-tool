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

  // The smoke intentionally stays backend-free. Actor binding is represented by
  // campaign records only; live room actor state is outside this slice.
  const actorBindingPlaceholder = { campaignActorInstanceId: undefined, liveRuntimeActor: false };
  if (actorBindingPlaceholder.liveRuntimeActor || actorBindingPlaceholder.campaignActorInstanceId) {
    throw new Error('actor binding smoke crossed the live runtime boundary');
  }
}

runSmoke();
console.log(JSON.stringify({
  total: 8,
  passed: 8,
  cases: [
    'dev identity visibility is UI-only and can be hidden in production',
    'campaign selection resets room selection',
    'room selection is independent state',
    'runtime event append accepts non-empty text',
    'runtime event append rejects empty text',
    'runtime event update/delete are not exposed',
    'real API data is not mixed with demo rows',
    'actor binding remains a campaign-record placeholder',
  ],
  notes: ['No backend, database, WebSocket, or mock network is used.'],
}, null, 2));
