import type { DndRangeProfile } from './actionTypes.js';

/** Approved local-source facts used by the D&D weapon-mode contract. */
export const DND_WEAPON_RANGE_PROVENANCE = {
  sourceId: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  sources: {
    weapons: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/装备/武器.htm',
      sha256: 'DFFA4E8D79C3A97C18FBD3631045A9DDD318A916A960A19C53F8BF2191EC89F7',
    },
    meleeAttacks: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/近战攻击.htm',
      sha256: '5B16E67A8CFEFCC20BD0DA2A2EFF2DFE234B9BA6BC51141F276D25E34CC1D2CE',
    },
    rangedAttacks: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/远程攻击.htm',
      sha256: '3F799847F0AAB29849464FF1F596AAB75A9CC04B4519452C2B6CAC3F2BCEFC2D',
    },
    attackAbilities: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/攻击检定.htm',
      sha256: 'A68E5D5A5772612FA80292B98CF1A33DB04ACA9F3C66E5E539CF6AED93674DDC',
    },
    weaponProperties: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/装备/词条.htm',
      sha256: '7DDBE92400A0E8A97940AD67D57249268F47418E48F1618CD71BA29BBEB9022A',
    },
    movementAndPosition: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/移动和位置.htm',
      sha256: '0C7E72DC0BCEF6FB95F1ABB16DC0800896D7E854B527DD42A21B26DD61F4C6E1',
    },
  },
} as const;

/** The approved grid rule gives every square this D&D distance. */
export const DND_2024_GRID_CELL_DISTANCE_FEET = 5 as const;

/** Approved occupied-space widths, normalized without binding free-text Actor size. */
export const DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS = [0.5, 1, 2, 3, 4] as const;

/** Ordinary melee reach, normalized once from the approved general rule. */
export const DND_2024_ORDINARY_MELEE_DISTANCE: Readonly<DndRangeProfile> = {
  reach: 5,
  unit: 'ft',
};

/** Dagger's source-row thrown range. This does not make that mode executable. */
export const DND_2024_DAGGER_THROWN_DISTANCE: Readonly<DndRangeProfile> = {
  normal: 20,
  long: 60,
  unit: 'ft',
};
