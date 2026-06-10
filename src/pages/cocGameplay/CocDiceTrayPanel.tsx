import { Button } from '../../../components/ui/button';

type CocDiceTrayPanelProps = {
  diceTray: Record<string, number>;
  onAddDie: (die: string) => void;
  onClearDice: () => void;
  onRollDice: () => void;
};

export function CocDiceTrayPanel({
  diceTray,
  onAddDie,
  onClearDice,
  onRollDice,
}: CocDiceTrayPanelProps) {
  const selectedDice = (Object.entries(diceTray) as [string, number][])
    .filter(([, count]) => count > 0)
    .map(([die, count]) => `${count}${die}`)
    .join(' + ');

  return (
    <div className="mt-auto pt-2 border-t border-[#2f7f68]/30">
      <div className="flex justify-between items-center mb-2 gap-2">
        <div className="text-[10px] uppercase font-bold text-[#8fb7aa]">
          选取投掷骰: {selectedDice || '—'}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#2f7f68]/55 text-[#8fb7aa]" onClick={onClearDice}>清空</Button>
          <Button size="sm" className="h-6 px-3 text-[10px] rounded-none bg-[#2f7f68] text-[#06100d] hover:bg-[#3a9278] font-bold" onClick={onRollDice} disabled={Object.values(diceTray).every(count => count === 0)}>R O L L</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
          <button
            key={die}
            className="w-10 h-10 border-2 border-[#2f7f68] bg-[#151a18] text-[#8fb7aa] font-bold text-xs hover:bg-[#2f7f68] hover:text-[#06100d] transition-colors relative"
            onClick={() => onAddDie(die)}
          >
            {die}
            {diceTray[die] > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none shadow-md">{diceTray[die]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
