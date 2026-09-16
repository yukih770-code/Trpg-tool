import type { DndCreatureSize } from './dndCreatureSize.js';

/** Approved fixed base sizes. Variable choices and temporary transformations are omitted. */
export const DND_FIXED_SPECIES_SIZES: Readonly<Record<string, { size: DndCreatureSize; sourceRef: string; sha256: string }>> = {
  'species.dwarf': { size: 'medium', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/矮人.htm', sha256: '4C20A005A6AE222FED0E97ACC2EBF00C22D0AD99FD512E536B5755B143F652F8' },
  'species.elf': { size: 'medium', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/精灵.htm', sha256: '7F8CDF74E5FB3A40CD8EA35999B5A089E995B23F783107E0ED8B9A96F422B224' },
  'species.halfling': { size: 'small', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/半身人.htm', sha256: '1711343A9D8B94A956E619D372A9E3B1FF452D1595496BC7E79BCE647C896763' },
  'species.gnome': { size: 'small', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/侏儒.htm', sha256: '809188A77F8BC2CDF615B5A3E4410E47CB395C357D9671D7DFC3FC2EEF81C4B0' },
  'species.dragonborn': { size: 'medium', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/龙裔.htm', sha256: '34A5C25349CA7AD952CBFEB80055891878823DCE3B246AEABE595E11C0F85DAE' },
  'species.orc': { size: 'medium', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/兽人.htm', sha256: '7BE8B93B11850FF7592C986174542450794EC6BF842A2C3BD7B70229F935A833' },
  'species.goliath': { size: 'medium', sourceRef: 'dnd-local-chm-primary:玩家手册2024/角色起源/种族/歌利亚.htm', sha256: 'D881CCE53B3F6613A680BC2B0E8D56142379C364B8C8B1E9C992D0D0D259A404' },
};
