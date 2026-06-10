import { useState } from 'react';
import { Button } from '../../../components/ui/button';

const SAN_LOSS_PRESETS = ['0/1', '0/1d3', '0/1d4', '1/1d4', '1/1d6', '1/1d10'];

type CocSanCheckPanelProps = {
  currentSan: number;
  onRunSanCheck: (lossExpression: string) => void;
};

export function CocSanCheckPanel({ currentSan, onRunSanCheck }: CocSanCheckPanelProps) {
  const [lossExpression, setLossExpression] = useState('0/1d4');

  return (
    <div className="border border-[#2f7f68]/35 bg-[#101413] p-4">
      <div className="border-b border-[#2f7f68]/30 pb-2 mb-3">
        <h3 className="text-[#8fb7aa] font-bold uppercase">
          理智检定 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">SAN CHECK</span>
        </h3>
        <p className="mt-1 text-xs text-[#8fb7aa]">
          当前 SAN {currentSan}。本轮只处理 SAN 损失，不自动执行疯狂流程。
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#8fb7aa]">
            SAN 损失表达式 <span className="text-[#8fb7aa]/65">LOSS EXPRESSION</span>
          </label>
          <input
            value={lossExpression}
            onChange={event => setLossExpression(event.target.value)}
            className="w-full border border-[#2f7f68]/45 bg-black/40 px-3 py-2 font-mono text-sm text-[#d4d4d8] outline-none focus:border-[#5aa58f]"
            placeholder="例如 0/1d4"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {SAN_LOSS_PRESETS.map(preset => (
            <button
              key={preset}
              type="button"
              className="border border-[#2f7f68]/35 bg-black/25 px-2 py-1 font-mono text-[11px] text-[#8fb7aa] hover:border-[#5aa58f] hover:text-[#d4d4d8]"
              onClick={() => setLossExpression(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          className="h-8 rounded-none bg-[#2f7f68] px-4 text-xs font-bold text-[#06100d] hover:bg-[#3a9278]"
          onClick={() => onRunSanCheck(lossExpression)}
        >
          执行 SAN Check
        </Button>
      </div>
    </div>
  );
}
