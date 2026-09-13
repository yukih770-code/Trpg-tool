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
      { id: 'existing', label: '选择已有角色' },
      { id: 'quickDraft', label: '使用临时角色' },
      { id: 'fullSheet', label: '创建角色' },
      { id: 'skipHostCharacter', label: '仅主持，不扮演角色' },
    ];
  }

  return [
    { id: 'existing', label: '选择已有角色' },
    { id: 'quickDraft', label: '使用临时角色' },
    { id: 'fullSheet', label: '创建角色' },
    { id: 'spectator', label: '以旁观者加入' },
  ];
}
