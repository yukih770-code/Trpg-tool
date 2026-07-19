import { describeRoomPlayerFlow } from './roomPlayerFlow';
import type { RoomMemberIdentity, RoomSnapshot } from './roomTypes';

export type RoomLobbyPresentationKind =
  | 'host_ready_to_manage'
  | 'player_waiting_room_approval'
  | 'player_needs_character'
  | 'player_can_submit_character'
  | 'player_waiting_character_review'
  | 'player_rejected'
  | 'player_approved_needs_ready'
  | 'player_ready_can_enter'
  | 'spectator_can_enter'
  | 'runtime_unavailable';

/**
 * Product-facing lobby copy derived from the existing room snapshot. This is
 * deliberately presentation-only: the server and Runtime Entry guard remain
 * authoritative for joining, character review, readiness, and entry.
 */
export interface RoomLobbyPresentationState {
  kind: RoomLobbyPresentationKind;
  roleLabel: string;
  stateLabel: string;
  primaryMessage: string;
  nextStepMessage: string;
  primaryCtaLabel?: string;
  secondaryCtaLabels?: string[];
  canShowCharacterEntry: boolean;
  canShowReadyAction: boolean;
  canShowRuntimeEntry: boolean;
  shouldShowSpectatorCopy: boolean;
  shouldShowHostReviewQueue: boolean;
  debugSummary?: string;
}

export interface RoomLobbyPresentationInput {
  room?: RoomSnapshot;
  memberId?: string;
  canEnterRuntime: boolean;
}

function memberFor(input: RoomLobbyPresentationInput): RoomMemberIdentity | undefined {
  return input.memberId
    ? input.room?.members.find((candidate) => candidate.memberId === input.memberId)
    : undefined;
}

export function getRoomLobbyPresentationState(input: RoomLobbyPresentationInput): RoomLobbyPresentationState {
  const member = memberFor(input);
  const flow = describeRoomPlayerFlow(input.room, input.memberId);

  if (!member || member.status !== 'active') {
    return {
      kind: 'player_waiting_room_approval',
      roleLabel: '加入申请',
      stateLabel: '等待主持人批准加入',
      primaryMessage: '你的加入请求正在等待主持人处理。',
      nextStepMessage: member?.role === 'spectator'
        ? '批准后可进入只读跑团桌面。'
        : '你可以先准备角色；批准后即可提交角色申请。',
      canShowCharacterEntry: member?.role === 'player',
      canShowReadyAction: false,
      canShowRuntimeEntry: false,
      shouldShowSpectatorCopy: member?.role === 'spectator',
      shouldShowHostReviewQueue: false,
      debugSummary: flow.state,
    };
  }

  if (member.role === 'host') {
    return {
      kind: 'host_ready_to_manage',
      roleLabel: '主持人',
      stateLabel: '可管理大厅',
      primaryMessage: '你可以审核待处理申请，也可以随时进入跑团桌面。',
      nextStepMessage: input.canEnterRuntime ? '进入桌面，或等待玩家陆续准备。' : '等待房间状态同步后再进入桌面。',
      primaryCtaLabel: '进入跑团桌面',
      canShowCharacterEntry: false,
      canShowReadyAction: false,
      canShowRuntimeEntry: true,
      shouldShowSpectatorCopy: false,
      shouldShowHostReviewQueue: true,
      debugSummary: flow.state,
    };
  }

  if (member.role === 'spectator') {
    return {
      kind: 'spectator_can_enter',
      roleLabel: '旁观者',
      stateLabel: '只读旁观',
      primaryMessage: '你将以旁观者身份进入，只读查看跑团桌面。',
      nextStepMessage: input.canEnterRuntime ? '可以进入桌面。' : '等待房间状态同步后再进入桌面。',
      primaryCtaLabel: '进入跑团桌面',
      canShowCharacterEntry: false,
      canShowReadyAction: false,
      canShowRuntimeEntry: true,
      shouldShowSpectatorCopy: true,
      shouldShowHostReviewQueue: false,
      debugSummary: flow.state,
    };
  }

  switch (flow.state) {
    case 'chooseCharacter':
      return {
        kind: 'player_needs_character',
        roleLabel: '已加入',
        stateLabel: '选择角色',
        primaryMessage: '请选择一个角色，或以旁观者加入。',
        nextStepMessage: '提交后等待主持人审核。',
        secondaryCtaLabels: ['选择已有角色', '创建快速角色', '完整车卡创建', '以旁观者加入'],
        canShowCharacterEntry: true,
        canShowReadyAction: false,
        canShowRuntimeEntry: false,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
    case 'characterRejected':
      return {
        kind: 'player_rejected',
        roleLabel: '已加入',
        stateLabel: '角色需要调整',
        primaryMessage: flow.detail,
        nextStepMessage: '修改或更换角色后重新提交。',
        secondaryCtaLabels: ['选择已有角色', '创建快速角色', '完整车卡创建', '以旁观者加入'],
        canShowCharacterEntry: true,
        canShowReadyAction: false,
        canShowRuntimeEntry: false,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
    case 'waitingForHostReview':
      return {
        kind: 'player_waiting_character_review',
        roleLabel: '已加入',
        stateLabel: '等待主持人审核',
        primaryMessage: '你的角色已提交，等待主持人审核。',
        nextStepMessage: '审核完成后即可标记 Ready。',
        canShowCharacterEntry: false,
        canShowReadyAction: false,
        canShowRuntimeEntry: false,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
    case 'waitingForReady':
      return {
        kind: 'player_approved_needs_ready',
        roleLabel: '已加入',
        stateLabel: '等待 Ready',
        primaryMessage: '角色已准入。准备好后点击 Ready。',
        nextStepMessage: '确认后就可以进入跑团桌面。',
        primaryCtaLabel: '我已准备',
        canShowCharacterEntry: false,
        canShowReadyAction: true,
        canShowRuntimeEntry: false,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
    case 'readyToEnter':
      return {
        kind: 'player_ready_can_enter',
        roleLabel: '已加入',
        stateLabel: '已 Ready',
        primaryMessage: '你已准备，可以进入跑团桌面。',
        nextStepMessage: '进入后等待主持人放置你的角色。',
        primaryCtaLabel: '进入跑团桌面',
        secondaryCtaLabels: ['取消 Ready'],
        canShowCharacterEntry: false,
        canShowReadyAction: true,
        canShowRuntimeEntry: true,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
    default:
      return {
        kind: 'runtime_unavailable',
        roleLabel: '房间成员',
        stateLabel: '等待同步',
        primaryMessage: '房间状态正在同步。',
        nextStepMessage: '请稍候再试。',
        canShowCharacterEntry: false,
        canShowReadyAction: false,
        canShowRuntimeEntry: false,
        shouldShowSpectatorCopy: false,
        shouldShowHostReviewQueue: false,
        debugSummary: flow.state,
      };
  }
}
