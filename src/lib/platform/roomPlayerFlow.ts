import type { RoomActorBindingSummary, RoomMemberIdentity, RoomSnapshot } from './roomTypes';

export type RoomPlayerFlowState =
  | 'waitingForMembership'
  | 'chooseCharacter'
  | 'waitingForHostReview'
  | 'characterRejected'
  | 'waitingForReady'
  | 'readyToEnter'
  | 'spectator'
  | 'host';

export interface RoomPlayerFlowGuidance {
  state: RoomPlayerFlowState;
  label: string;
  detail: string;
  nextAction: string;
}

export function describeTokenControlHint(input: {
  locale: 'en' | 'zh';
  isHost: boolean;
  hasSelectedToken: boolean;
  canMoveSelectedToken: boolean;
  hasControlledBinding: boolean;
  hasControlledToken: boolean;
}): string | undefined {
  if (input.hasSelectedToken) {
    if (input.isHost) return input.locale === 'en' ? 'Host can move every token.' : '主持人可移动所有 Token。';
    return input.canMoveSelectedToken
      ? input.locale === 'en' ? 'Your character can move.' : '你的角色，可移动。'
      : input.locale === 'en' ? 'The host controls this token or has not granted movement.' : '该 Token 由主持人控制，或尚未授权移动。';
  }
  if (!input.isHost && input.hasControlledBinding && !input.hasControlledToken) {
    return input.locale === 'en'
      ? 'Your admitted character has not been placed on the map yet. Please wait for the host.'
      : '你的角色已准入，但尚未被放置到地图。请等待主持人放置。';
  }
  return undefined;
}

function bindingFor(room: RoomSnapshot | undefined, memberId: string): RoomActorBindingSummary | undefined {
  return room?.lobby?.actorBindings.find((binding) => binding.memberId === memberId);
}

/**
 * Product-facing room progress copy. This derives labels only; the server and
 * RoomRuntimeEntry guard remain the authority for membership, clearance, ready,
 * and Runtime entry.
 */
export function describeRoomPlayerFlow(
  room: RoomSnapshot | undefined,
  memberId: string | undefined,
): RoomPlayerFlowGuidance {
  const member: RoomMemberIdentity | undefined = memberId
    ? room?.members.find((candidate) => candidate.memberId === memberId)
    : undefined;

  if (!member || member.status !== 'active') {
    return {
      state: 'waitingForMembership',
      label: '等待加入房间',
      detail: '你的加入请求正在等待主持人处理。',
      nextAction: '等待主持人批准加入房间。',
    };
  }

  if (member.role === 'spectator') {
    return {
      state: 'spectator',
      label: '旁观者',
      detail: '你可以查看地图和测距，但不能移动 Token 或修改地图。',
      nextAction: '可直接进入只读跑团桌面。',
    };
  }

  if (member.role === 'host') {
    return {
      state: 'host',
      label: '主持人',
      detail: '你可以审核玩家角色、放置 Token，并控制全部 Token。',
      nextAction: '查看待处理项，或进入跑团桌面。',
    };
  }

  const binding = bindingFor(room, member.memberId);
  if (!binding || binding.status === 'notSubmitted') {
    return {
      state: 'chooseCharacter',
      label: '等待选择角色',
      detail: '选择角色库中的角色，或使用本系统的角色创建工具。',
      nextAction: '选择入场角色并提交给主持人。',
    };
  }

  if (binding.status === 'rejected' || binding.clearance?.status === 'rejected') {
    return {
      state: 'characterRejected',
      label: '角色需要调整',
      detail: binding.rejectionReason
        ? `主持人反馈：${binding.rejectionReason}`
        : '主持人拒绝了该角色。你可以修改摘要、换一个角色，或以旁观者加入。',
      nextAction: '修改或更换角色后重新提交。',
    };
  }

  if (binding.status !== 'approved' || binding.clearance?.status !== 'approved') {
    return {
      state: 'waitingForHostReview',
      label: '已提交，等待主持人审核',
      detail: '你的角色已提交，等待主持人审核。',
      nextAction: '等待审核完成。',
    };
  }

  const ready = room?.lobby?.readyStates.find((candidate) => candidate.memberId === member.memberId)?.status;
  if (ready === 'ready') {
    return {
      state: 'readyToEnter',
      label: '已准备',
      detail: '你已准备，可以进入跑团桌面。',
      nextAction: '进入跑团桌面，等待主持人放置你的角色 Token。',
    };
  }

  return {
    state: 'waitingForReady',
    label: '角色已通过，等待准备',
    detail: '角色已通过审核。准备好后点击“我已准备”。',
    nextAction: '点击“我已准备”。',
  };
}
