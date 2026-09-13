import { type Locale } from '../../i18n';
import { dndActorPresetName, listDndActorPresets, type DndActorPresetId } from '../../lib/dnd/dndActorPresets';

/**
 * Starting-point picker for quick actor creation.
 *
 * AI-LANDMARK: DND_ACTOR_PRESET_PICKER_V1
 *
 * Presentational only. It picks a STARTING STATE; it creates nothing, saves
 * nothing, and knows nothing about campaigns or actors. The caller materializes
 * the chosen preset into the canonical sheet.
 *
 * Accessibility: a real radiogroup of radio buttons, so arrow keys move between
 * options, Space selects, focus is visible, and a screen reader announces the
 * group name, each option and which one is checked. Selection is carried by
 * ring + border + weight, never by colour alone.
 */

type Props = {
  locale: Locale;
  audience: 'npc' | 'monster';
  value: DndActorPresetId;
  onChange: (presetId: DndActorPresetId) => void;
  disabled?: boolean;
  /** Radio inputs must share a name that is unique on the page. */
  groupName: string;
};

const copy = {
  legend: ['选择起点', 'Choose a starting point'],
  hint: ['随时可以改。创建后打开角色卡即可修改任何数值。', 'You can change anything later — open the sheet after creating.'],
  recommended: ['常用', 'Common'],
  provenance: [
    '这些是本项目自定义的通用原型，不是官方资料。',
    'These are project-defined generic archetypes, not official content.',
  ],
} as const;

export function DndActorPresetPicker({ locale, audience, value, onChange, disabled, groupName }: Props) {
  const en = locale === 'en';
  const text = (entry: readonly [string, string]) => entry[en ? 1 : 0];
  const presets = listDndActorPresets(audience);

  return (
    <fieldset className="min-w-0 border-0 p-0" disabled={disabled} data-dnd-actor-preset-picker={audience}>
      <legend className="text-xs font-bold text-[#2f2a22]">{text(copy.legend)}</legend>
      <p className="mt-0.5 text-[11px] leading-4 text-[#51483d]">{text(copy.hint)}</p>
      <div role="radiogroup" aria-label={text(copy.legend)} className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {presets.map((preset) => {
          const selected = preset.id === value;
          const inputId = `${groupName}-${preset.id}`;
          return (
            <label
              key={preset.id}
              htmlFor={inputId}
              data-preset-option={preset.id}
              data-selected={selected ? 'true' : 'false'}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-left focus-within:ring-2 focus-within:ring-[#58180d]/40 ${
                selected ? 'border-[#58180d]/60 bg-[#fff6e6] ring-1 ring-[#58180d]/25' : 'border-[#2f2a22]/15 bg-white'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={preset.id}
                checked={selected}
                onChange={() => onChange(preset.id)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#58180d]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`text-xs ${selected ? 'font-black' : 'font-bold'} text-[#2f2a22]`}>
                    {dndActorPresetName(preset, en ? 'en' : 'zh-CN')}
                  </span>
                  {preset.recommended && (
                    <span className="rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#58180d]">
                      {text(copy.recommended)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[10px] leading-4 text-[#51483d]">
                  {en ? preset.blurbEn : preset.blurbCn}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-[#51483d]">{text(copy.provenance)}</p>
    </fieldset>
  );
}
