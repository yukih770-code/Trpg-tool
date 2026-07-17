export const DND_ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
export type DndAbilityKey = typeof DND_ABILITY_KEYS[number];

export const DND_SKILL_KEYS = [
  'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception', 'history',
  'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleightOfHand', 'stealth', 'survival',
] as const;
export type DndSkillKey = typeof DND_SKILL_KEYS[number];

export type DndLiteActorKind = 'pc' | 'npc' | 'monster' | 'unknown';

export type DndLiteActorActionKind = 'weapon_attack' | 'spell_attack' | 'save_dc' | 'damage_only' | 'utility';

export type DndLiteActorAction = {
  id: string;
  name: string;
  kind: DndLiteActorActionKind;
  attackBonus?: number;
  damageFormula?: string;
  damageType?: string;
  saveAbility?: DndAbilityKey;
  saveDc?: number;
  notes?: string;
};

export type DndLiteActorSheet = {
  schemaVersion: 1;
  actorKind: DndLiteActorKind;
  displayName: string;
  abilities: Record<DndAbilityKey, number>;
  proficiencyBonus: number;
  defenses: {
    armorClass?: number;
    maxHp?: number;
    currentHp?: number;
    temporaryHp?: number;
    speedFt?: number;
  };
  savingThrows?: Partial<Record<DndAbilityKey, number>>;
  skills?: Partial<Record<DndSkillKey, number>>;
  actions: DndLiteActorAction[];
  notes?: string;
  tags?: string[];
};

export type DndLiteActorValidation = {
  valid: boolean;
  errors: string[];
};

export type DndLiteActorSummary = {
  displayName: string;
  actorKind: DndLiteActorKind;
  armorClass?: number;
  hpText?: string;
  speedFt?: number;
  actionCount: number;
  tags: string[];
};

export type DndLiteCombatantPrefill = {
  displayName: string;
  kind: 'character' | 'npc' | 'other';
  sourceActorInstanceId?: string;
  armorClass?: number;
  hpCurrent?: number;
  hpMax?: number;
  temporaryHp?: number;
  notes?: string;
};
