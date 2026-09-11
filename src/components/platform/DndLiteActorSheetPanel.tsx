import { useEffect, useMemo, useRef, useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CampaignActorInstance, CampaignActorSourceReviewResponse } from '../../lib/api/campaignRoomApiClient';
import { createDefaultDndLiteActorSheet, getDndLiteCombatantPrefill, summarizeDndLiteActorSheet, validateDndLiteActorSheet } from '../../lib/dnd/dndLiteActorSheet';
import { DND_ABILITY_KEYS, DND_SKILL_KEYS, type DndAbilityKey, type DndLiteActorAction, type DndLiteActorActionKind, type DndLiteActorKind, type DndLiteActorSheet, type DndSkillKey } from '../../lib/dnd/dndLiteActorTypes';
import { deriveDndLiteActorSheetFromSnapshot, readDndCharacterSnapshot, type DndCharacterSheetDerivation } from '../../lib/dnd/dndCharacterToLiteActorSheet';

type Props = {
  locale: Locale;
  canManage: boolean;
  campaignActors: CampaignActorInstance[];
  sheets: Record<string, DndLiteActorSheet>;
  onSave: (actorInstanceId: string, sheet: DndLiteActorSheet) => Promise<void>;
  onClear: (actorInstanceId: string) => Promise<void>;
  initialActorInstanceId?: string;
  onUseAction?: (actorInstanceId: string, actionId: string) => void;
  onAddToCombat?: (prefill: ReturnType<typeof getDndLiteCombatantPrefill>) => void;
  /**
   * T11b. Reads the host-facing review of the player's current character. The
   * panel never sees the player's character data — only this derived summary.
   * Optional: the panel degrades to its T9 behaviour when it is absent.
   */
  onReviewSource?: (actorInstanceId: string) => Promise<CampaignActorSourceReviewResponse>;
  /**
   * T11b. Accepts the reviewed version as the campaign's new frozen source.
   * Deliberately separate from the combat sheet: accepting updates what "Fill
   * from character" would derive from, and changes nothing that is in play.
   */
  onAcceptSource?: (actorInstanceId: string, expectedSourceHash: string) => Promise<void>;
};

const abilityNames: Record<DndAbilityKey, [string, string]> = {
  strength: ['力量', 'Strength'], dexterity: ['敏捷', 'Dexterity'], constitution: ['体质', 'Constitution'],
  intelligence: ['智力', 'Intelligence'], wisdom: ['感知', 'Wisdom'], charisma: ['魅力', 'Charisma'],
};

const skillNames: Record<DndSkillKey, [string, string]> = {
  acrobatics: ['体操', 'Acrobatics'], animalHandling: ['驯兽', 'Animal Handling'], arcana: ['奥秘', 'Arcana'], athletics: ['运动', 'Athletics'], deception: ['欺瞒', 'Deception'], history: ['历史', 'History'], insight: ['洞悉', 'Insight'], intimidation: ['威吓', 'Intimidation'], investigation: ['调查', 'Investigation'], medicine: ['医药', 'Medicine'], nature: ['自然', 'Nature'], perception: ['察觉', 'Perception'], performance: ['表演', 'Performance'], persuasion: ['游说', 'Persuasion'], religion: ['宗教', 'Religion'], sleightOfHand: ['巧手', 'Sleight of Hand'], stealth: ['隐匿', 'Stealth'], survival: ['求生', 'Survival'],
};

// T9 derivation copy. Kept local and bilingual, exactly like abilityNames /
// skillNames above, so filling from a character adds no i18n key.
const derivationText = {
  fill: ['从角色卡填充', 'Fill from character'],
  noSnapshot: ['该角色没有可读取的角色卡快照，请手动填写。', 'No readable character snapshot for this actor — fill the sheet manually.'],
  filled: ['已从角色卡填充。请复核后再保存。', 'Filled from the character sheet. Review it before saving.'],
  frozen: ['数据来自加入战役时冻结的角色卡快照，不会随角色升级自动更新。', 'Values come from the character snapshot frozen when this actor joined the campaign; they do not update as the character levels up.'],
  needsReview: ['需复核', 'Needs review'],
  notDerived: ['未导出', 'Not derived'],
  overwriteWarning: ['将覆盖当前草稿；已保存的卡片在你按下保存前不受影响。', 'This replaces the current draft. The saved sheet is untouched until you press save.'],
} as const;

// T11b source-review copy. Same local bilingual pattern as above.
const reviewText = {
  heading: ['角色卡来源', 'Character source'],
  review: ['检查角色卡更新', 'Review update'],
  reviewing: ['检查中…', 'Reviewing…'],
  notLinked: ['该角色未关联玩家角色卡，无法检查更新。', 'This actor is not linked to a player character, so there is nothing to review.'],
  changed: ['角色卡自批准以来已变更。', 'Character source has changed since approval.'],
  unchanged: ['角色卡与已批准的版本一致。', 'The character source matches the approved version.'],
  unknown: ['无法读取其中一个版本，差异不完整。', 'One of the versions could not be read, so this comparison is incomplete.'],
  counted: ['已比较 %n 个战斗相关字段。', 'Compared %n combat-relevant fields.'],
  privacy: ['以下仅为推导出的战斗相关数值；主持人不会看到玩家的角色卡原文。', 'These are derived, combat-relevant values only. The host never sees the player\u2019s character data.'],
  accept: ['接受新版本', 'Accept new source version'],
  accepting: ['接受中…', 'Accepting…'],
  accepted: ['已接受新版本。战斗数据未改变——如需应用，请使用“从角色卡填充”。', 'New source version accepted. Nothing in play changed \u2014 use \u201cFill from character\u201d to apply it to the combat sheet.'],
  acceptNote: ['接受只会更新战役记录的角色卡版本，不会改动当前生命值、状态或先攻。', 'Accepting only updates the version this campaign records. It does not touch current HP, conditions or initiative.'],
  conflict: ['角色卡在你复核之后又发生了变化，请重新检查。', 'The character changed again after you reviewed it. Review it once more.'],
  failed: ['无法读取角色卡来源。', 'The character source could not be read.'],
  nothingToAccept: ['没有可接受的新版本。', 'There is no new version to accept.'],
  none: ['无', 'none'],
  checking: ['正在检查角色卡更新…', 'Checking for character updates\u2026'],
  checkFailed: ['暂时无法检查角色卡更新。', 'Could not check for character updates just now.'],
  showDetail: ['查看差异', 'Review update'],
  hideDetail: ['收起差异', 'Hide details'],
} as const;

const reviewGroupText: Record<string, [string, string]> = {
  identity: ['身份', 'Identity'],
  defenses: ['防御', 'Defences'],
  abilities: ['属性', 'Abilities'],
  proficiencies: ['豁免与技能', 'Saves and skills'],
};

const derivedFieldText: Record<string, [string, string]> = {
  armorClass: ['护甲等级', 'Armour class'],
  savingThrows: ['豁免', 'Saving throws'],
  skills: ['技能', 'Skills'],
  speedFt: ['速度', 'Speed'],
  actions: ['动作', 'Actions'],
  spellSlots: ['法术位', 'Spell slots'],
  classResources: ['职业资源', 'Class resources'],
  inventory: ['物品', 'Inventory'],
  conditions: ['状态', 'Conditions'],
};

function actorKindFromCampaign(actor: CampaignActorInstance): DndLiteActorKind {
  return actor.actorKind === 'pc' ? 'pc' : actor.actorKind === 'npc' ? 'npc' : actor.actorKind === 'monster' ? 'monster' : 'unknown';
}

function asNumber(value: string, fallback?: number): number | undefined {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function DndLiteActorSheetPanel({ locale, canManage, campaignActors, sheets, onSave, onClear, onUseAction, onAddToCombat, onReviewSource, onAcceptSource, initialActorInstanceId }: Props) {
  const { t } = createTranslator(locale);
  const [actorInstanceId, setActorInstanceId] = useState(initialActorInstanceId ?? '');
  useEffect(() => { if (initialActorInstanceId) setActorInstanceId(initialActorInstanceId); }, [initialActorInstanceId]);
  const [draft, setDraft] = useState<DndLiteActorSheet>(() => createDefaultDndLiteActorSheet());
  const [saveKey, setSaveKey] = useState<DndAbilityKey>('strength');
  const [saveValue, setSaveValue] = useState('');
  const [skillKey, setSkillKey] = useState<DndSkillKey>('athletics');
  const [skillValue, setSkillValue] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  // Result of the last explicit fill, so the panel can report what was
  // approximated and what the character could not supply.
  const [derivation, setDerivation] = useState<DndCharacterSheetDerivation | undefined>(undefined);
  /**
   * T11b. The last source review, together with the actor it describes. The
   * pairing is what makes the result reusable: the panel can tell "I already
   * know this actor's status" from "this belongs to the previous selection".
   *
   * It is fetched automatically on selection so the host learns a character
   * changed WITHOUT having to ask. The request is read-only — it writes
   * nothing, accepts nothing and fills nothing — and the detailed diff stays
   * collapsed until the host asks for it.
   */
  const [sourceReview, setSourceReview] = useState<{ actorInstanceId: string; response: CampaignActorSourceReviewResponse } | undefined>(undefined);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourceNotice, setSourceNotice] = useState('');
  /** Set only when a check actually failed, so silence never reads as "fine". */
  const [sourceCheckFailed, setSourceCheckFailed] = useState(false);
  const [sourceDetailOpen, setSourceDetailOpen] = useState(false);
  /**
   * Monotonic request token. Switching actors quickly can leave an older
   * response in flight; only the newest token is allowed to land, so a slow
   * reply for actor A can never be shown under actor B.
   */
  const sourceRequestToken = useRef(0);
  const selectedActor = useMemo(() => campaignActors.find((actor) => actor.campaignActorInstanceId === actorInstanceId), [actorInstanceId, campaignActors]);

  useEffect(() => {
    if (!selectedActor) return;
    setDraft(sheets[selectedActor.campaignActorInstanceId] ?? createDefaultDndLiteActorSheet({ displayName: selectedActor.displayName, actorKind: actorKindFromCampaign(selectedActor) }));
    setNotice('');
    // Deliberately does NOT derive here. Filling is an explicit host action:
    // an automatic fill would let a host save derived numbers without ever
    // having looked at them.
    setDerivation(undefined);
    setSourceNotice('');
    setSourceDetailOpen(false);
  }, [selectedActor, sheets]);

  const text = (entry: readonly [string, string]) => entry[locale === 'en' ? 1 : 0];
  const canReviewSource = Boolean(onReviewSource && selectedActor?.sourceActorId);
  /** The review currently on screen, or undefined if it describes another actor. */
  const currentReview = sourceReview && sourceReview.actorInstanceId === selectedActor?.campaignActorInstanceId
    ? sourceReview.response
    : undefined;

  /**
   * Reads the derived review. Read-only: nothing is written by this, and the
   * response carries no character data. Returns the response so callers that
   * need it (acceptance) do not have to re-read state.
   */
  const loadSourceReview = async (actorInstanceId: string): Promise<CampaignActorSourceReviewResponse | undefined> => {
    if (!onReviewSource) return undefined;
    const token = ++sourceRequestToken.current;
    setSourceBusy(true);
    setSourceCheckFailed(false);
    try {
      const response = await onReviewSource(actorInstanceId);
      if (token !== sourceRequestToken.current) return undefined; // a newer selection won
      setSourceReview({ actorInstanceId, response });
      return response;
    } catch {
      if (token === sourceRequestToken.current) {
        setSourceReview(undefined);
        setSourceCheckFailed(true);
      }
      return undefined;
    } finally {
      if (token === sourceRequestToken.current) setSourceBusy(false);
    }
  };

  /**
   * Passive check. Runs once per eligible selection so the host sees "this
   * character changed" without asking. Failures stay quiet: the panel says it
   * could not check rather than implying the source is unchanged.
   */
  useEffect(() => {
    if (!selectedActor || !onReviewSource || !selectedActor.sourceActorId) {
      sourceRequestToken.current += 1; // cancel anything in flight for a prior actor
      setSourceReview(undefined);
      setSourceCheckFailed(false);
      setSourceBusy(false);
      return;
    }
    if (sourceReview?.actorInstanceId === selectedActor.campaignActorInstanceId) return; // already current
    void loadSourceReview(selectedActor.campaignActorInstanceId);
    // `sourceReview` is read only as an "already have it" guard; re-running on
    // its own change would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActor?.campaignActorInstanceId, selectedActor?.sourceActorId, onReviewSource]);

  /**
   * "Review update". Reuses the review the passive check already fetched when
   * it still describes this actor, and only then spends another request.
   */
  const reviewSource = async () => {
    if (!selectedActor) return;
    setSourceNotice('');
    setSourceDetailOpen(true);
    if (currentReview) return;
    if (!(await loadSourceReview(selectedActor.campaignActorInstanceId))) {
      setSourceNotice(text(reviewText.failed));
    }
  };

  /**
   * Accepts exactly the version just reviewed. The combat sheet is deliberately
   * left alone: applying the new numbers is the separate "Fill from character"
   * action above, so a host never has a level-up silently overwrite their edits.
   */
  const acceptSource = async () => {
    const expected = currentReview?.currentSourceHash;
    if (!selectedActor || !onAcceptSource || !expected) {
      setSourceNotice(text(reviewText.nothingToAccept));
      return;
    }
    const actorInstanceId = selectedActor.campaignActorInstanceId;
    setSourceBusy(true);
    try {
      await onAcceptSource(actorInstanceId, expected);
      setSourceNotice(text(reviewText.accepted));
      setSourceBusy(false);
      // Re-read so the panel shows the state it just created rather than a
      // stale "changed" banner.
      await loadSourceReview(actorInstanceId);
    } catch (error) {
      const conflict = error instanceof Error && /409|conflict/i.test(error.message);
      setSourceNotice(text(conflict ? reviewText.conflict : reviewText.failed));
      setSourceReview(undefined);
      setSourceBusy(false);
    }
  };

  const canDeriveFromCharacter = useMemo(
    () => Boolean(selectedActor && readDndCharacterSnapshot(selectedActor.snapshotPayload)),
    [selectedActor],
  );

  /**
   * Fills the DRAFT from the campaign actor's character snapshot. It never
   * writes: the host still reviews and presses save, and an already-saved sheet
   * stays untouched until they do.
   */
  const fillFromCharacter = () => {
    if (!selectedActor) return;
    const result = deriveDndLiteActorSheetFromSnapshot(selectedActor.snapshotPayload, {
      displayNameFallback: selectedActor.displayName,
    });
    if (!result) {
      setDerivation(undefined);
      setNotice(derivationText.noSnapshot[locale === 'en' ? 1 : 0]);
      return;
    }
    setDraft({ ...result.sheet, actorKind: actorKindFromCampaign(selectedActor) });
    setDerivation(result);
    setNotice(derivationText.filled[locale === 'en' ? 1 : 0]);
  };

  const update = (next: Partial<DndLiteActorSheet>) => setDraft((previous) => ({ ...previous, ...next }));
  const updateDefense = (key: keyof DndLiteActorSheet['defenses'], value: string) => setDraft((previous) => ({ ...previous, defenses: { ...previous.defenses, [key]: asNumber(value) } }));
  const updateAbility = (key: DndAbilityKey, value: string) => setDraft((previous) => ({ ...previous, abilities: { ...previous.abilities, [key]: asNumber(value, previous.abilities[key]) ?? previous.abilities[key] } }));
  const updateAction = (actionId: string, next: Partial<DndLiteActorAction>) => setDraft((previous) => ({ ...previous, actions: previous.actions.map((action) => action.id === actionId ? { ...action, ...next } : action) }));
  const summary = summarizeDndLiteActorSheet(draft);

  const addAction = () => setDraft((previous) => ({ ...previous, actions: [...previous.actions, { id: `action-${Date.now()}-${previous.actions.length}`, name: t('dndActorSheet.newAction'), kind: 'weapon_attack' }] }));
  const addSaveOverride = () => {
    const value = asNumber(saveValue);
    if (value === undefined) return;
    setDraft((previous) => ({ ...previous, savingThrows: { ...previous.savingThrows, [saveKey]: value } }));
    setSaveValue('');
  };
  const addSkillOverride = () => {
    const value = asNumber(skillValue);
    if (value === undefined) return;
    setDraft((previous) => ({ ...previous, skills: { ...previous.skills, [skillKey]: value } }));
    setSkillValue('');
  };
  const saveSheet = async () => {
    if (!selectedActor) return;
    const validation = validateDndLiteActorSheet(draft);
    if (!validation.valid) { setNotice(t('dndActorSheet.invalid')); return; }
    setSaving(true);
    try {
      await onSave(selectedActor.campaignActorInstanceId, draft);
      setNotice(t('dndActorSheet.savedLocal'));
    } catch {
      setNotice(t('dndActorSheet.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const clearSheet = async () => {
    if (!selectedActor) return;
    setSaving(true);
    try {
      await onClear(selectedActor.campaignActorInstanceId);
      setDraft(createDefaultDndLiteActorSheet({ displayName: selectedActor.displayName, actorKind: actorKindFromCampaign(selectedActor) }));
      setNotice(t('dndActorSheet.cleared'));
    } catch {
      setNotice(t('dndActorSheet.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section data-canonical-surface="campaign-actor-sheet" className="mt-5 rounded-2xl border border-[#58180d]/15 bg-[#fffaf0] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('dndActorSheet.eyebrow')}</div><h4 className="mt-1 text-xl font-black">{t('dndActorSheet.title')}</h4><p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('dndActorSheet.note')}</p></div><span className="rounded-full bg-[#58180d]/10 px-2.5 py-1 text-xs font-bold text-[#58180d]">DND 5e</span></div>
      {!canManage && <p className="mt-3 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#51483d]">{t('dndActorSheet.hostOnly')}</p>}
      {campaignActors.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[#2f2a22]/15 bg-white p-4 text-sm text-[#51483d]">{t('dndActorSheet.noActors')}</p> : <>
        <div className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-white p-3"><label className="text-xs font-bold">{t('dndActorSheet.selectActor')}</label><select value={actorInstanceId} onChange={(event) => setActorInstanceId(event.target.value)} disabled={!canManage} className="mt-2 w-full rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndActorSheet.chooseActor')}</option>{campaignActors.map((actor) => <option key={actor.campaignActorInstanceId} value={actor.campaignActorInstanceId}>{actor.displayName}{sheets[actor.campaignActorInstanceId] ? ` · ${t('dndActorSheet.sheetReady')}` : ''}</option>)}</select></div>
        {selectedActor && <div className="mt-4 grid gap-3">
          {onReviewSource && <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-bold">{text(reviewText.heading)}</h5>
              {canReviewSource && <button type="button" onClick={() => sourceDetailOpen ? setSourceDetailOpen(false) : void reviewSource()} disabled={!canManage || (sourceBusy && !currentReview)} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{sourceBusy && !currentReview ? text(reviewText.reviewing) : text(sourceDetailOpen ? reviewText.hideDetail : reviewText.showDetail)}</button>}
            </div>
            {!canReviewSource && <p className="mt-2 text-[11px] leading-5 text-[#51483d]">{text(reviewText.notLinked)}</p>}
            {/* Passive state. Populated by the automatic check on selection, so
                a changed character announces itself; the diff below stays
                collapsed until the host asks for it. */}
            {canReviewSource && !currentReview && sourceBusy && <p className="mt-2 text-[11px] leading-5 text-[#51483d]">{text(reviewText.checking)}</p>}
            {canReviewSource && !currentReview && !sourceBusy && sourceCheckFailed && <p className="mt-2 text-[11px] leading-5 text-[#51483d]">{text(reviewText.checkFailed)}</p>}
            {currentReview && <div className="mt-3 grid gap-2">
              <p className={`text-xs font-bold ${currentReview.status === 'changed' ? 'text-[#8b3a2f]' : 'text-[#51483d]'}`}>
                {text(currentReview.status === 'changed' ? reviewText.changed : currentReview.status === 'unchanged' ? reviewText.unchanged : reviewText.unknown)}
              </p>
              {sourceDetailOpen && <>
                <p className="text-[11px] leading-5 text-[#51483d]">{text(reviewText.privacy)}</p>
                {currentReview.review && <p className="text-[11px] leading-5 text-[#51483d]">{text(reviewText.counted).replace('%n', String(currentReview.review.comparedFieldCount))}</p>}
                {(currentReview.review?.changedFields.length ?? 0) > 0 && <ul className="grid gap-1 rounded-lg bg-[#f7f3ea] p-3 text-[11px] leading-5 text-[#2f2a22]">
                  {currentReview.review!.changedFields.map((field) => <li key={field.key} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[10px] uppercase tracking-wide text-[#51483d]">{(reviewGroupText[field.group] ?? [field.group, field.group])[locale === 'en' ? 1 : 0]}</span>
                    <span className="font-bold">{field.label}</span>
                    <span>{field.before ?? text(reviewText.none)} → {field.after ?? text(reviewText.none)}</span>
                  </li>)}
                </ul>}
              </>}
              {/* Accepting stays behind an opened review: the host should read
                  what changed before making it the campaign's new baseline. */}
              {sourceDetailOpen && currentReview.status === 'changed' && onAcceptSource && <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void acceptSource()} disabled={!canManage || sourceBusy || !currentReview.currentSourceHash} className="rounded-md border border-[#58180d]/25 bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#58180d] disabled:opacity-40">{sourceBusy ? text(reviewText.accepting) : text(reviewText.accept)}</button>
                <span className="text-[11px] leading-4 text-[#51483d]">{text(reviewText.acceptNote)}</span>
              </div>}
            </div>}
            {sourceNotice && <p className="mt-2 text-xs text-[#51483d]">{sourceNotice}</p>}
          </div>}
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={fillFromCharacter} disabled={!canManage || saving || !canDeriveFromCharacter} className="rounded-md border border-[#58180d]/25 bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#58180d] disabled:opacity-40">{derivationText.fill[locale === 'en' ? 1 : 0]}</button>
              <span className="text-[11px] leading-4 text-[#51483d]">{canDeriveFromCharacter ? derivationText.overwriteWarning[locale === 'en' ? 1 : 0] : derivationText.noSnapshot[locale === 'en' ? 1 : 0]}</span>
            </div>
            {derivation && <div className="mt-3 grid gap-2 rounded-lg bg-[#f7f3ea] p-3 text-[11px] leading-5 text-[#51483d]">
              <p>{derivationText.frozen[locale === 'en' ? 1 : 0]}</p>
              {derivation.approximations.length > 0 && <p><span className="font-bold text-[#8b3a2f]">{derivationText.needsReview[locale === 'en' ? 1 : 0]}:</span> {derivation.approximations.map((field) => (derivedFieldText[field] ?? [field, field])[locale === 'en' ? 1 : 0]).join('、')}</p>}
              {derivation.omissions.length > 0 && <p><span className="font-bold">{derivationText.notDerived[locale === 'en' ? 1 : 0]}:</span> {derivation.omissions.map((field) => (derivedFieldText[field] ?? [field, field])[locale === 'en' ? 1 : 0]).join('、')}</p>}
            </div>}
          </div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="grid gap-2 sm:grid-cols-3"><input value={draft.displayName} onChange={(event) => update({ displayName: event.target.value })} disabled={!canManage} placeholder={t('dndActorSheet.displayName')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><select value={draft.actorKind} onChange={(event) => update({ actorKind: event.target.value as DndLiteActorKind })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="pc">{t('dndActorSheet.pc')}</option><option value="npc">{t('dndActorSheet.npc')}</option><option value="monster">{t('dndActorSheet.monster')}</option><option value="unknown">{t('dndActorSheet.unknown')}</option></select><input value={draft.proficiencyBonus} onChange={(event) => update({ proficiencyBonus: asNumber(event.target.value, draft.proficiencyBonus) ?? draft.proficiencyBonus })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.proficiency')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><input value={draft.defenses.armorClass ?? ''} onChange={(event) => updateDefense('armorClass', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.ac')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.currentHp ?? ''} onChange={(event) => updateDefense('currentHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.currentHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.maxHp ?? ''} onChange={(event) => updateDefense('maxHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.maxHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.temporaryHp ?? ''} onChange={(event) => updateDefense('temporaryHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.tempHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.speedFt ?? ''} onChange={(event) => updateDefense('speedFt', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.speed')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /></div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.abilities')}</h5><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{DND_ABILITY_KEYS.map((key) => <label key={key} className="rounded-lg bg-[#f7f3ea] px-3 py-2 text-xs"><span className="font-bold">{abilityNames[key][locale === 'en' ? 1 : 0]}</span><span className="ml-2 text-[#51483d]">{t('dndActorSheet.modifier')} {draft.abilities[key] >= 10 ? '+' : ''}{Math.floor((draft.abilities[key] - 10) / 2)}</span><input value={draft.abilities[key]} onChange={(event) => updateAbility(key, event.target.value)} disabled={!canManage} type="number" className="mt-2 w-full rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-sm disabled:opacity-50" /></label>)}</div></div>
          <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.saves')}</h5><div className="mt-3 flex gap-2"><select value={saveKey} onChange={(event) => setSaveKey(event.target.value as DndAbilityKey)} disabled={!canManage} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-2 text-xs disabled:opacity-50">{DND_ABILITY_KEYS.map((key) => <option key={key} value={key}>{abilityNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={saveValue} onChange={(event) => setSaveValue(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.override')} className="w-24 rounded-md border border-[#2f2a22]/15 px-2 py-2 text-xs disabled:opacity-50" /><button type="button" onClick={addSaveOverride} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.set')}</button></div><div className="mt-2 flex flex-wrap gap-2">{Object.entries(draft.savingThrows ?? {}).map(([key, value]) => <button key={key} type="button" onClick={() => setDraft((previous) => { const next = { ...previous.savingThrows }; delete next[key as DndAbilityKey]; return { ...previous, savingThrows: next }; })} disabled={!canManage} className="rounded-full bg-[#f7f3ea] px-2 py-1 text-xs">{abilityNames[key as DndAbilityKey][locale === 'en' ? 1 : 0]} {value} ×</button>)}</div></div><div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.skills')}</h5><div className="mt-3 flex gap-2"><select value={skillKey} onChange={(event) => setSkillKey(event.target.value as DndSkillKey)} disabled={!canManage} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-2 text-xs disabled:opacity-50">{DND_SKILL_KEYS.map((key) => <option key={key} value={key}>{skillNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={skillValue} onChange={(event) => setSkillValue(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.override')} className="w-24 rounded-md border border-[#2f2a22]/15 px-2 py-2 text-xs disabled:opacity-50" /><button type="button" onClick={addSkillOverride} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.set')}</button></div><div className="mt-2 flex flex-wrap gap-2">{Object.entries(draft.skills ?? {}).map(([key, value]) => <button key={key} type="button" onClick={() => setDraft((previous) => { const next = { ...previous.skills }; delete next[key as DndSkillKey]; return { ...previous, skills: next }; })} disabled={!canManage} className="rounded-full bg-[#f7f3ea] px-2 py-1 text-xs">{skillNames[key as DndSkillKey][locale === 'en' ? 1 : 0]} {value} ×</button>)}</div></div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="flex items-center justify-between gap-2"><h5 className="font-bold text-sm">{t('dndActorSheet.actions')}</h5><button type="button" onClick={addAction} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.addAction')}</button></div><div className="mt-3 grid gap-3">{draft.actions.map((action) => <div key={action.id} className="rounded-lg bg-[#f7f3ea] p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={action.name} onChange={(event) => updateAction(action.id, { name: event.target.value })} disabled={!canManage} placeholder={t('dndActorSheet.actionName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><select value={action.kind} onChange={(event) => updateAction(action.id, { kind: event.target.value as DndLiteActorActionKind })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50"><option value="weapon_attack">{t('dndActorSheet.weaponAttack')}</option><option value="spell_attack">{t('dndActorSheet.spellAttack')}</option><option value="save_dc">{t('dndActorSheet.saveAction')}</option><option value="damage_only">{t('dndActorSheet.damageOnly')}</option><option value="utility">{t('dndActorSheet.utility')}</option></select><input value={action.attackBonus ?? ''} onChange={(event) => updateAction(action.id, { attackBonus: asNumber(event.target.value) })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.attackBonus')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.damageFormula ?? ''} onChange={(event) => updateAction(action.id, { damageFormula: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.damageFormula')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.damageType ?? ''} onChange={(event) => updateAction(action.id, { damageType: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.damageType')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><select value={action.saveAbility ?? ''} onChange={(event) => updateAction(action.id, { saveAbility: event.target.value ? event.target.value as DndAbilityKey : undefined })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50"><option value="">{t('dndActorSheet.saveAbility')}</option>{DND_ABILITY_KEYS.map((key) => <option key={key} value={key}>{abilityNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={action.saveDc ?? ''} onChange={(event) => updateAction(action.id, { saveDc: asNumber(event.target.value) })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.saveDc')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.notes ?? ''} onChange={(event) => updateAction(action.id, { notes: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.notes')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /></div><div className="mt-2 flex flex-wrap gap-2">{onUseAction && <button type="button" onClick={() => onUseAction?.(selectedActor.campaignActorInstanceId, action.id)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.useInDice')}</button>}<button type="button" onClick={() => setDraft((previous) => ({ ...previous, actions: previous.actions.filter((item) => item.id !== action.id) }))} disabled={!canManage} className="rounded-md border border-[#8b3a2f]/20 bg-white px-2.5 py-1.5 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('dndActorSheet.remove')}</button></div></div>)}</div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><textarea value={draft.notes ?? ''} onChange={(event) => update({ notes: event.target.value || undefined })} disabled={!canManage || saving} placeholder={t('dndActorSheet.notes')} className="min-h-20 w-full rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={(draft.tags ?? []).join(', ')} onChange={(event) => update({ tags: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} disabled={!canManage || saving} placeholder={t('dndActorSheet.tags')} className="mt-2 w-full rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void saveSheet()} disabled={!canManage || saving} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndActorSheet.save')}</button>{onAddToCombat && <button type="button" onClick={() => onAddToCombat?.(getDndLiteCombatantPrefill(draft, selectedActor.campaignActorInstanceId))} disabled={!canManage || saving} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.addToCombat')}</button>}<button type="button" onClick={() => void clearSheet()} disabled={!canManage || saving} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.clear')}</button></div>{notice && <p className="mt-2 text-xs text-[#51483d]">{notice}</p>}<p className="mt-3 text-[11px] text-[#51483d]">{summary.displayName} · AC {summary.armorClass ?? '—'} · HP {summary.hpText ?? '—'} · {summary.actionCount} {t('dndActorSheet.actionCount')}</p></div>
        </div>}
      </>}
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('dndActorSheet.boundary')}</p>
    </section>
  );
}
