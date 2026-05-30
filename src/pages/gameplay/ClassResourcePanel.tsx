import { Button } from '../../../components/ui/button';
import type { CharacterData } from '../../lib/dnd-types';

interface ClassResourcePanelProps {
  character: CharacterData;
  initializeRuntimeResources: () => void;
  updateClassResourceCurrent: (id: string, nextCurrent: number) => void;
  resetClassResource: (id: string) => void;
  updatePactMagicCurrent: (nextCurrent: number) => void;
  resetPactMagic: () => void;
}

export function ClassResourcePanel({
  character,
  initializeRuntimeResources,
  updateClassResourceCurrent,
  resetClassResource,
  updatePactMagicCurrent,
  resetPactMagic,
}: ClassResourcePanelProps) {
  return (
    <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#58180d]">
      <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
        <h3 className="text-xs font-bold uppercase text-[#58180d]">职业资源 / Class Resources</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] rounded-none border-[#58180d] text-[#58180d] px-2 py-0 uppercase"
          onClick={initializeRuntimeResources}
        >
          初始化
        </Button>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar font-sans">
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
              <div className="mt-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
                  disabled={resource.current <= 0}
                  onClick={() => updateClassResourceCurrent(resource.id, resource.current - 1)}
                >
                  -
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
                  disabled={resource.current >= resource.max}
                  onClick={() => updateClassResourceCurrent(resource.id, resource.current + 1)}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
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
            <div className="mt-2 flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
                disabled={character.pactMagicState.current <= 0}
                onClick={() => updatePactMagicCurrent(character.pactMagicState!.current - 1)}
              >
                -
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
                disabled={character.pactMagicState.current >= character.pactMagicState.max}
                onClick={() => updatePactMagicCurrent(character.pactMagicState!.current + 1)}
              >
                +
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-none border-[#58180d] text-[#58180d]"
                onClick={resetPactMagic}
              >
                重置
              </Button>
            </div>
            {character.pactMagicState.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{character.pactMagicState.notes}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
