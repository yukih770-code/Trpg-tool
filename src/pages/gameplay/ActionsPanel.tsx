import { Button } from '../../../components/ui/button';
import type { DndActionDefinition, ResourceCost } from '../../lib/dnd2024/action-registry-types';

interface ActionCostPreview {
  label: string;
  amount: number;
  current: number;
  max: number;
  canPay: boolean;
}

interface ActionsPanelProps {
  visibleRegistryActions: DndActionDefinition[];
  canUseRegistryAction: (action: DndActionDefinition) => boolean;
  getActionInsufficientLabel: (action: DndActionDefinition) => string | undefined;
  getActionCostPreview: (cost: ResourceCost) => ActionCostPreview;
  useRegistryAction: (action: DndActionDefinition) => void;
}

export function ActionsPanel({
  visibleRegistryActions,
  canUseRegistryAction,
  getActionInsufficientLabel,
  getActionCostPreview,
  useRegistryAction,
}: ActionsPanelProps) {
  return (
    <div className="border-2 border-[#58180d] bg-[#ede1c5] p-3 flex flex-col gap-2 shadow-[3px_3px_0px_#58180d] lg:h-[180px] lg:shrink-0">
      <div className="flex justify-between items-center border-b-2 border-[#58180d] pb-2">
        <h3 className="text-sm font-black uppercase text-[#58180d]">可用动作 / ACTIONS v0</h3>
        <span className="text-[10px] font-bold text-[#58180d]/60 uppercase">{visibleRegistryActions.length} 可用</span>
      </div>

      {visibleRegistryActions.length > 0 ? (
        <div className="space-y-2 max-h-[260px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {visibleRegistryActions.map(action => {
            const canUse = canUseRegistryAction(action);
            const insufficientLabel = getActionInsufficientLabel(action);
            return (
              <div key={action.id} className="bg-white/70 border border-[#58180d]/40 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-black text-[#2c1810] text-base leading-tight">{action.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#58180d]/70">
                      {action.category && <span>分类: {action.category}</span>}
                      {action.actionType && <span>{action.actionType}</span>}
                      {action.sourceFeature && <span>来源: {action.sourceFeature}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-[11px] rounded-none bg-[#58180d] text-[#fdf6e3] font-black shrink-0 disabled:opacity-40"
                    disabled={!canUse}
                    onClick={() => useRegistryAction(action)}
                  >
                    使用
                  </Button>
                </div>
                {action.resourceCost && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {action.resourceCost.map((cost, index) => {
                      const preview = getActionCostPreview(cost);
                      return (
                        <span key={`${action.id}-cost-${index}`} className={`border px-1.5 py-0.5 text-[10px] font-bold ${preview.canPay ? 'border-[#58180d]/30 bg-[#f4ecd8] text-[#58180d]' : 'border-red-800/30 bg-red-900/10 text-red-800'}`}>
                          {preview.label} -{preview.amount} ({preview.current} / {preview.max})
                        </span>
                      );
                    })}
                  </div>
                )}
                {!canUse && insufficientLabel && <p className="mt-1 text-[10px] font-bold text-red-800">{insufficientLabel}</p>}
                {action.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/55">{action.notes}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-[#58180d]/60 font-bold uppercase border-2 border-dashed border-[#58180d]/30 p-4 text-center">
          当前没有匹配已有资源的注册动作
        </div>
      )}
    </div>
  );
}
