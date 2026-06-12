import { Button } from '../../../components/ui/button';
import type { CharacterData } from '../../lib/dnd-types';
import type { DndClassResourceConsumption } from '../../store/characterStore';

interface ClassResourcePanelProps {
  character: CharacterData;
  initializeRuntimeResources: () => void;
  consumeClassResource: (id: string, amount?: number) => DndClassResourceConsumption;
  updateClassResourceCurrent: (id: string, nextCurrent: number) => void;
  resetClassResource: (id: string) => void;
  consumePactMagicResource: () => void;
  updatePactMagicCurrent: (nextCurrent: number) => void;
  resetPactMagic: () => void;
}

export function ClassResourcePanel({
  character,
  initializeRuntimeResources,
  consumeClassResource,
  updateClassResourceCurrent,
  resetClassResource,
  consumePactMagicResource,
  updatePactMagicCurrent,
  resetPactMagic,
}: ClassResourcePanelProps) {
  return (
    <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#58180d] lg:h-[250px] lg:shrink-0 lg:overflow-hidden">
      <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
        <h3 className="text-xs font-bold uppercase text-[#58180d]">职业资源 / CLASS RESOURCES</h3>
        <span className="text-[10px] font-bold uppercase text-[#58180d]/50">状态维护</span>
      </div>

      <div className="space-y-2 max-h-[260px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto pr-1 custom-scrollbar font-sans">
        {character.classResources.length > 0 ? (
          character.classResources.map((resource) => (
            <div key={resource.id} className="bg-white/60 border border-[#58180d]/30 p-2">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-bold text-[#2c1810] text-sm">{resource.sourceFeature || resource.id}</div>
                  <div className="text-[10px] text-[#58180d]/60">{resource.id}</div>
                </div>
                <div className="text-sm font-black text-[#58180d] shrink-0">{resource.current} / {resource.max}</div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#58180d]/70">
                {resource.recoveryType && <span>恢复: {resource.recoveryType}</span>}
                {resource.dice && <span>骰面: {resource.dice}</span>}
              </div>
              <div className="mt-2 flex gap-1 opacity-70">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                  disabled={resource.current <= 0}
                  onClick={() => consumeClassResource(resource.id, 1)}
                >
                  -
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                  disabled={resource.current >= resource.max}
                  onClick={() => updateClassResourceCurrent(resource.id, resource.current + 1)}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                  onClick={() => resetClassResource(resource.id)}
                >
                  重置
                </Button>
              </div>
              {resource.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{resource.notes}</p>}
            </div>
          ))
        ) : (
          <div className="text-xs text-[#58180d]/60 font-bold uppercase border-2 border-dashed border-[#58180d]/30 p-4 text-center">
            暂无职业资源
          </div>
        )}

        {character.pactMagicState && (
          <div className="bg-[#ede1c5]/80 border border-[#58180d]/40 p-2">
            <div className="flex justify-between gap-3">
              <div className="font-bold text-[#58180d] text-sm">契约魔法位 Pact Magic</div>
              <div className="text-sm font-black text-[#58180d] shrink-0">{character.pactMagicState.current} / {character.pactMagicState.max}</div>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#58180d]/70">
              <span>环级: {character.pactMagicState.slotLevel}</span>
              <span>恢复: {character.pactMagicState.recoveryType}</span>
            </div>
            <div className="mt-2 flex gap-1 opacity-70">
              <Button
                size="sm"
                variant="outline"
                className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                disabled={character.pactMagicState.current <= 0}
                onClick={consumePactMagicResource}
              >
                -
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                disabled={character.pactMagicState.current >= character.pactMagicState.max}
                onClick={() => updatePactMagicCurrent(character.pactMagicState!.current + 1)}
              >
                +
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-5 px-1.5 text-[9px] rounded-none border-[#58180d]/40 text-[#58180d]/70 bg-transparent"
                onClick={resetPactMagic}
              >
                重置
              </Button>
            </div>
            {character.pactMagicState.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{character.pactMagicState.notes}</p>}
          </div>
        )}
      </div>

      <div className="border-t border-[#58180d]/20 pt-2 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-5 text-[9px] rounded-none border-[#58180d]/30 text-[#58180d]/60 px-2 py-0 uppercase bg-transparent"
          onClick={initializeRuntimeResources}
        >
          初始化职业资源
        </Button>
      </div>
    </div>
  );
}
