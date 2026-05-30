export type DndActionType =
  | 'Action'
  | 'Bonus Action'
  | 'Reaction'
  | 'No Action'
  | 'Passive'
  | 'Special';

export type DndResourceCostType = 'classResource' | 'pactMagic';

export type DndActionCategory =
  | 'classFeature'
  | 'spellcasting'
  | 'combat'
  | 'utility'
  | 'special';

export interface ResourceCost {
  resourceType: DndResourceCostType;
  resourceId?: string;
  amount: number;
  notes?: string;
}

export interface DndActionDefinition {
  id: string;
  name: string;
  sourceFeature?: string;
  category?: DndActionCategory;
  actionType?: DndActionType;
  description?: string;
  resourceCost?: ResourceCost[];
  tags?: string[];
  notes?: string;
}
