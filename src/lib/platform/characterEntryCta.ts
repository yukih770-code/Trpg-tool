import type { RoomMemberRole } from './roomTypes';

/**
 * Visible character-entry actions for the lobby. This is presentation guidance
 * only: membership approval, clearance, and ready checks remain server-owned.
 */
export type CharacterEntryActionId = 'existing' | 'quickDraft' | 'fullSheet' | 'spectator' | 'skipHostCharacter';

export type CharacterEntryAction = {
  id: CharacterEntryActionId;
  label: string;
};

export function getCharacterEntryActions(role?: RoomMemberRole): CharacterEntryAction[] {
  if (role === 'host') {
    return [
      { id: 'existing', label: '选择主持人角色' },
      { id: 'quickDraft', label: '创建主持人角色' },
      { id: 'fullSheet', label: '完整车卡创建' },
      { id: 'skipHostCharacter', label: '跳过，直接主持' },
    ];
  }

  return [
    { id: 'existing', label: '选择已有角色' },
    { id: 'quickDraft', label: '创建快速角色' },
    { id: 'fullSheet', label: '完整车卡创建' },
    { id: 'spectator', label: '以旁观者加入' },
  ];
}
