import { type Locale } from '../../i18n';
import { pausedSystemDisplayName, pausedSystemNotice } from '../../lib/platform/publicGameSystemAvailability';

/**
 * Compact "this system is paused" state.
 *
 * AI-LANDMARK: PAUSED_GAME_SYSTEM_NOTICE_V1
 *
 * Shown wherever a Call of Cthulhu or Cyberpunk Red record can still be reached
 * — a saved campaign, a stored character — now that their frontends are paused.
 * It replaces the old editor rather than re-exposing it, and it says plainly
 * that nothing was deleted or converted, so a user with existing records is
 * never left guessing.
 */

type Props = {
  locale: Locale;
  systemId: string | undefined;
  /** Optional escape hatch back to somewhere supported. */
  onBack?: () => void;
  backLabel?: string;
};

export function PausedGameSystemNotice({ locale, systemId, onBack, backLabel }: Props) {
  const en = locale === 'en';
  const lang = en ? 'en' : 'zh-CN';
  return (
    <section
      role="status"
      data-paused-game-system={systemId ?? 'unknown'}
      className="mx-auto my-6 w-full max-w-xl rounded-2xl border border-[#2f2a22]/15 bg-white p-5 text-[#2f2a22] shadow-sm"
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
        {en ? 'Temporarily unavailable' : '暂时不可用'}
      </div>
      <h2 className="mt-1 text-lg font-black">{pausedSystemDisplayName(systemId, lang)}</h2>
      <p className="mt-2 text-sm leading-6 text-[#51483d]">{pausedSystemNotice(systemId, lang)}</p>
      <p className="mt-2 text-xs leading-5 text-[#51483d]">
        {en
          ? 'The current release focuses on D&D 2024. This system will return once its experience is rebuilt on the new information architecture.'
          : '当前版本专注于 D&D 2024。该系统会在按新信息架构重建体验后回归。'}
      </p>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white"
        >
          {backLabel ?? (en ? 'Back' : '返回')}
        </button>
      )}
    </section>
  );
}
