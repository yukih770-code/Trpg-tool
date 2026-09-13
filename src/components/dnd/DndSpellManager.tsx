import { useState } from 'react';
import type { CharacterData, SpellInfo } from '../../lib/dnd-types';
import { changeDndSpellbook, getDndSpellManagement } from '../../lib/dnd2024/spellManagement';

/** The same editor is embedded in creation and in the play dialog. */
export function DndSpellManager({ character, baseSpells, personalSpells = [], onChange }: {
  character: CharacterData; baseSpells: SpellInfo[]; personalSpells?: SpellInfo[];
  onChange: (book: CharacterData['spellbook']) => void;
}) {
  const [error, setError] = useState(''), [search, setSearch] = useState('');
  const model = getDndSpellManagement(character, baseSpells, personalSpells);
  const spells = [...new Map([...model.selectable, ...character.spellbook.known].map(s => [s.name_cn, s])).values()];
  const change = (action: 'learn' | 'prepare', spell: SpellInfo) => {
    try { onChange(changeDndSpellbook(character, model.selectable, action, spell)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : '无法保存法术选择。'); }
  };
  return <div className="space-y-3">
    <p className="text-xs text-[#58180d]">{model.availability.reason} {model.preparation.ruleHint}</p>
    <p className="text-xs">已知 {character.spellbook.known.length} · 已准备 {character.spellbook.prepared.length}{model.preparation.preparedSpellLimit !== null ? ` / ${model.preparation.preparedSpellLimit}` : ''}</p>
    <input aria-label="搜索法术" placeholder="搜索法术" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded border bg-white p-2 text-sm" />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="grid gap-3 md:grid-cols-2">{spells.filter(s => `${s.name_cn} ${s.name_en}`.toLowerCase().includes(search.toLowerCase())).map(spell => {
      const known = character.spellbook.known.some(s => s.name_cn === spell.name_cn), prepared = character.spellbook.prepared.includes(spell.name_cn);
      const available = model.selectable.some(s => s.name_cn === spell.name_cn);
      return <article key={spell.name_cn} className="rounded border border-[#58180d]/20 bg-white/60 p-3">
        <h3 className="font-bold">{spell.name_cn} <span className="text-xs font-normal">{spell.level === 0 ? '戏法' : `${spell.level} 环`}</span></h3>
        <p className="mt-1 text-xs">{spell.desc}</p>
        <p className="mt-1 text-xs text-slate-500">{spell.school} · {spell.cast_time} · {spell.range} · {spell.duration}</p>
        {!available && <p className="mt-1 text-xs text-amber-800">已保存的选择；当前来源中不可新增。</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => change('learn', spell)} className="rounded border px-2 py-1 text-xs">{known ? '移出已知' : '加入已知'}</button>
          {spell.level > 0 && <button type="button" disabled={!known || (!available && !prepared)} onClick={() => change('prepare', spell)} className="rounded border px-2 py-1 text-xs disabled:opacity-40">{prepared ? '取消准备' : '准备'}</button>}
        </div>
      </article>;
    })}</div>
    {!spells.length && <p className="text-sm">当前职业和等级没有可安全映射的法术。请先选择职业或添加经过审核的个人资料。</p>}
  </div>;
}
