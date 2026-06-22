import { useState } from 'react';
import { useCocStore } from '../store/cocStore';
import { getCocDerivedStats } from '../lib/coc-utils';
import { Input } from '../../components/ui/input';
import {
  CharacterSheetSectionTabs,
  type CharacterSheetSectionDefinition,
} from './sheet/CharacterSheetSectionTabs';
import { CharacterCampaignCta, useCharacterCampaignCta } from '../components/platform/CharacterCampaignCta';

// Static investigator-sheet sections (display / downtime only; no runtime checks).
// Skills currently remain inside Overview; weapons/gear live under Notes.
const COC_SHEET_SECTIONS: CharacterSheetSectionDefinition[] = [
  { id: 'overview', label: '概览 Overview' },
  { id: 'background', label: '背景 Background' },
  { id: 'notes', label: '记录 Notes' },
];

export function CocSheet() {
  const { character, updateField, toggleSkillGrowthMark } = useCocStore();
  const campaignCta = useCharacterCampaignCta();
  const [sheetSection, setSheetSection] = useState<string>('overview');

  const { db, build, move } = getCocDerivedStats(character.characteristics);
  const runtime = character.runtime;
  const runtimeHp = runtime?.hp ?? character.hp;
  const runtimeMp = runtime?.mp ?? character.mp;
  const runtimeSan = runtime?.san ?? {
    current: character.sanity.current,
    max: character.sanity.max,
    initial: character.sanity.start,
  };
  const runtimeLuck = runtime?.luck ?? { current: character.luck.current };

  const renderCharacteristic = (label: string, key: keyof typeof character.characteristics) => {
    const val = character.characteristics[key];
    return (
      <div className="border border-[#059669]/30 p-2 bg-[#1a1a1a] flex flex-col items-center">
        <div className="text-[10px] uppercase font-mono text-[#059669]/70 mb-1">{label}</div>
        <div className="text-2xl font-bold">
          {val}
        </div>
        <div className="flex w-full justify-between px-2 mt-1 gap-1 text-[10px] opacity-60">
          <div>{Math.floor(val/2)}</div>
          <div>{Math.floor(val/5)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-[#d4d4d8] font-serif">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-[#059669]/50 pb-6">
        <div className="md:col-span-1 border border-[#059669] p-4 bg-[#111]">
           <h2 className="text-3xl font-bold uppercase tracking-tighter text-[#059669] mb-2">{character.name || '未命名'}</h2>
           <div className="text-sm space-y-1 font-mono opacity-80">
             <div><span className="text-[#059669]">职业:</span> {character.occupation}</div>
             <div><span className="text-[#059669]">年龄:</span> {character.age}</div>
             <div><span className="text-[#059669]">居所:</span> {character.residence}</div>
             <div><span className="text-[#059669]">玩家:</span> {character.player}</div>
           </div>
        </div>
        
        <div className="md:col-span-3 grid grid-cols-5 md:grid-cols-9 gap-2">
          {renderCharacteristic('力量 STR', 'STR')}
          {renderCharacteristic('敏捷 DEX', 'DEX')}
          {renderCharacteristic('意志 POW', 'POW')}
          {renderCharacteristic('体质 CON', 'CON')}
          {renderCharacteristic('外貌 APP', 'APP')}
          {renderCharacteristic('教育 EDU', 'EDU')}
          {renderCharacteristic('体型 SIZ', 'SIZ')}
          {renderCharacteristic('智力 INT', 'INT')}
           <div className="border border-[#059669]/30 p-2 bg-[#1a1a1a] flex flex-col items-center border-l-[#059669]">
              <div className="text-[10px] uppercase font-mono text-[#059669]/70 mb-1">幸运 LUK</div>
              <div className="text-2xl font-bold">
                {runtimeLuck.current}
              </div>
              <div className="flex w-full justify-between px-2 mt-1 gap-1 text-[10px] opacity-60">
                <div>{Math.floor(runtimeLuck.current/2)}</div>
                <div>{Math.floor(runtimeLuck.current/5)}</div>
              </div>
           </div>
        </div>
      </div>
      {campaignCta && <CharacterCampaignCta {...campaignCta} />}

      <CharacterSheetSectionTabs
        sections={COC_SHEET_SECTIONS}
        activeId={sheetSection}
        onChange={setSheetSection}
        ariaLabel="COC investigator sheet sections"
        className="border-b border-[#059669]/40 pb-2"
        activeTabClassName="border-[#059669] bg-[#059669] text-[#06100d]"
        inactiveTabClassName="border-[#059669]/30 text-[#059669]/70 hover:text-[#059669]"
      />

      {sheetSection === 'overview' && (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Stats & Derived */}
        <div className="md:col-span-3 space-y-4">
          <div className="border border-[#059669]/30 p-3 bg-[#111] space-y-4 font-mono text-sm">
             <div className="flex justify-between items-center pb-2 border-b border-[#059669]/20">
               <span className="text-[#059669]">理智 (SAN)</span>
               <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{runtimeSan.current}</span>
                  <span>/ {runtimeSan.max}</span>
               </div>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#059669]/20">
               <span className="text-[#059669]">体数 (HP)</span>
               <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{runtimeHp.current}</span>
                  <span>/ {runtimeHp.max}</span>
               </div>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#059669]/20">
               <span className="text-[#059669]">魔法 (MP)</span>
               <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{runtimeMp.current}</span>
                  <span>/ {runtimeMp.max}</span>
               </div>
             </div>
             <div className="text-[10px] text-[#059669]/70 leading-relaxed">
               运行时数值请在游玩面板修改。
             </div>
             <div className="flex justify-between items-center">
               <span className="text-[#059669] opacity-70">克苏鲁神话</span>
               <span>{character.skills.find(s=>s.name === '克苏鲁神话 (Cthulhu Mythos)')?.value || 0}</span>
             </div>
          </div>

          <div className="border border-[#059669]/30 p-3 bg-[#111] grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="border border-[#059669]/20 p-2">
              <div className="text-[#059669] mb-1">伤害加值 DB</div>
              <div className="font-bold text-lg">{db}</div>
            </div>
            <div className="border border-[#059669]/20 p-2">
              <div className="text-[#059669] mb-1">体格 Build</div>
              <div className="font-bold text-lg">{build}</div>
            </div>
            <div className="border border-[#059669]/20 p-2 col-span-2">
              <div className="text-[#059669] mb-1">移动力 Move Rate</div>
              <div className="font-bold text-lg">{move}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills */}
        <div className="md:col-span-9 border border-[#059669]/30 bg-[#111] p-4 text-[#d4d4d8]">
           <h3 className="text-[#059669] font-bold uppercase tracking-widest mb-4 border-b border-[#059669]/30 pb-2">调查员技能 (Investigator Skills)</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
             {[...character.skills].sort((a,b) => a.name.localeCompare(b.name)).map(skill => (
                 <div key={skill.name} className="flex items-center justify-between group">
                   <div className="flex items-center gap-2 flex-1">
                     <input
                       type="checkbox"
                       className="accent-[#059669]"
                       checked={Boolean(runtime?.skillGrowthMarks?.[skill.name])}
                       onChange={() => toggleSkillGrowthMark(skill.name)}
                       title="成长标记"
                     />
                     <div className="flex-1 min-w-0">
                       <div className="text-xs sm:text-sm font-mono truncate" title={skill.name}>
                         {skill.name.split(' (')[0]} <span className="opacity-40 text-[9px] uppercase hidden sm:inline">{skill.name.split(' (')[1]?.replace(')','')}</span>
                       </div>
                       <div className="flex gap-1 mt-0.5 text-[9px] font-mono">
                         {skill.isOccupational && <span className="text-[#34d399]">本职</span>}
                         {skill.isPersonal && <span className="text-[#a7f3d0]">兴趣</span>}
                       </div>
                     </div>
                   </div>
                   <div className="flex gap-1 ml-2 shrink-0">
                     <div className="w-9 text-center text-white font-bold font-mono text-sm">
                       {skill.value}
                     </div>
                     <div className="flex flex-col text-[8px] font-mono opacity-50 justify-center w-4">
                        <span>{Math.floor(skill.value/2)}</span>
                        <span>{Math.floor(skill.value/5)}</span>
                    </div>
                  </div>
                </div>
             ))}
           </div>
        </div>
      </div>
      )}

      {/* Backstory & Inventory Section */}
      {(sheetSection === 'background' || sheetSection === 'notes') && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sheetSection === 'background' && (
        <div className="border border-[#059669]/30 bg-[#111] p-4 text-[#d4d4d8]">
          <h3 className="text-[#059669] font-bold uppercase tracking-widest mb-4 border-b border-[#059669]/30 pb-2">背景故事 (Backstory)</h3>
          <div className="space-y-4 text-xs font-mono">
            {Object.entries({
              personalDescription: "形象描述 (Personal Description)",
              ideologyBeliefs: "思想与信念 (Ideology/Beliefs)",
              significantPeople: "重要之人 (Significant People)",
              meaningfulLocations: "意义非凡之地 (Meaningful Locations)",
              treasuredPossessions: "珍视之物 (Treasured Possessions)",
              traits: "特征 (Traits)",
              injuriesScars: "伤痕与疤痕 (Injuries & Scars)",
              phobiasManias: "恐惧症与躁狂症 (Phobias & Manias)",
              arcaneTomesSpells: "奥术典籍与法术 (Arcane Tomes, Spells)",
              encounters: "遭遇克苏鲁神话之人 (Encounters with Strange Entities)"
            }).map(([key, label]) => (
               <div key={key}>
                 <div className="text-[#059669]/70 mb-1">{label}</div>
                 <textarea 
                   className="w-full bg-[#1a1a1a] border border-[#059669]/20 p-2 text-[#d4d4d8] focus:border-[#059669] focus:outline-none resize-y min-h-[60px] custom-scrollbar"
                   value={(character.backstory as any)[key]}
                   onChange={(e) => updateField('backstory', { ...character.backstory, [key]: e.target.value })}
                 />
               </div>
            ))}
          </div>
        </div>
        )}

        {sheetSection === 'notes' && (
        <div className="space-y-6">
          <div className="border border-[#059669]/30 bg-[#111] p-4 text-[#d4d4d8]">
            <div className="flex justify-between items-center mb-4 border-b border-[#059669]/30 pb-2">
              <h3 className="text-[#059669] font-bold uppercase tracking-widest">随身物品 (Inventory)</h3>
            </div>
            <textarea 
               className="w-full bg-[#1a1a1a] border border-[#059669]/20 p-2 text-[#d4d4d8] focus:border-[#059669] focus:outline-none resize-y min-h-[200px] custom-scrollbar text-sm font-mono leading-relaxed placeholder:opacity-30"
               placeholder="手电筒&#10;提灯&#10;日记本&#10;一把生锈的钥匙..."
               value={character.inventory.join('\n')}
               onChange={(e) => updateField('inventory', e.target.value.split('\n'))}
            />
          </div>

          <div className="border border-[#059669]/30 bg-[#111] p-4 text-[#d4d4d8]">
            <h3 className="text-[#059669] font-bold uppercase tracking-widest mb-4 border-b border-[#059669]/30 pb-2">资产状况 (Cash & Assets)</h3>
            <div className="space-y-4 text-xs font-mono">
               <div>
                 <div className="text-[#059669]/70 mb-1">消费水平 (Spending Level)</div>
                 <Input className="bg-[#1a1a1a] border-[#059669]/20 rounded-none h-8 text-[#d4d4d8]" value={character.finances.spendingLevel} onChange={(e) => updateField('finances', {...character.finances, spendingLevel: e.target.value})} />
               </div>
               <div>
                 <div className="text-[#059669]/70 mb-1">现金 (Cash)</div>
                 <Input className="bg-[#1a1a1a] border-[#059669]/20 rounded-none h-8 text-[#d4d4d8]" value={character.finances.cash} onChange={(e) => updateField('finances', {...character.finances, cash: e.target.value})} />
               </div>
               <div>
                 <div className="text-[#059669]/70 mb-1">资产 (Assets)</div>
                 <textarea className="w-full bg-[#1a1a1a] border border-[#059669]/20 p-2 text-[#d4d4d8] focus:border-[#059669] focus:outline-none resize-y min-h-[60px]" value={character.finances.assets} onChange={(e) => updateField('finances', {...character.finances, assets: e.target.value})} />
               </div>
            </div>
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}
