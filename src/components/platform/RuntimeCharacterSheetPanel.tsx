import { RuntimeActorBoundaryNote } from './RuntimeActorBoundaryNote';
import { RuntimeInventoryBoundaryNote } from './RuntimeInventoryBoundaryNote';
import type { RuntimeInventoryItem, RuntimeInventorySummary } from './runtimeInventoryAdapter';

/**
 * RuntimeCharacterSheetPanel (M46) — read-only runtime character sheet.
 *
 * AI-LANDMARK: RUNTIME_CHARACTER_SHEET_PANEL_V0
 *
 * Upgrades the player "我的角色" surface from a bare summary to a tabletop-usable
 * READ-ONLY sheet. It renders whatever character data the room actually has
 * (identity + admission/ready/binding), plus system-tailored stat sections that
 * safely show "暂无该项数据" when the underlying fields do not exist yet — it
 * NEVER fabricates rule numbers, edits an actor, writes a store, or reacts to the
 * manual state log. The caller (bridge) builds RuntimeCharacterSummary from the
 * membership actor binding / snapshot / entry context via a safe adapter. Adding
 * real stats later only means the adapter fills the arrays — no UI rewrite.
 */

export interface RuntimeCharacterStat {
  label: string;
  value: string;
}

export interface RuntimeCharacterSummary {
  displayName?: string;
  /** RoomSystemId, e.g. 'dnd5e-2024' | 'coc7e' | 'cp-red' | 'custom'. */
  system?: string;
  /** RoomActorBindingSource origin. */
  source?: string;
  /** Player / seat / membership display label. */
  playerLabel?: string;
  /** Character-clearance (admission) status. */
  admissionStatus?: string;
  /** 'ready' | 'notReady'. */
  readyState?: string;
  /** Lobby binding-draft status. */
  bindingStatus?: string;
  coreStats: RuntimeCharacterStat[];
  skillHighlights: RuntimeCharacterStat[];
  resourceHighlights: RuntimeCharacterStat[];
  equipmentHighlights: string[];
  featureHighlights: RuntimeCharacterStat[];
  notes: string[];
  /** Non-fatal notes about what data was / wasn't available (adapter). */
  sourceWarnings: string[];
}

export interface RuntimeCharacterSheetPanelProps {
  summary?: RuntimeCharacterSummary | null;
  role?: 'host' | 'player' | 'spectator';
  /** Read-only inventory / equipment summary (M55), built by runtimeInventoryAdapter. */
  inventory?: RuntimeInventorySummary | null;
}

const SYSTEM_LABEL: Record<string, string> = {
  'dnd5e-2024': 'DND 5E (2024)',
  coc7e: '克苏鲁的呼唤 7E',
  'cp-red': '赛博朋克 RED',
  custom: '自定义系统',
};

const SYSTEM_SHEET_HINT: Record<string, string> = {
  'dnd5e-2024': '完整角色卡将包含：AC / HP / 临时 HP / 熟练加值 / 豁免 / 常用技能 / 法术资源 / 装备 / 被动感知。',
  coc7e: '完整角色卡将包含：HP / MP / SAN / Luck / 主要技能 / 武器 / 随身物 / 伤势状态。',
  'cp-red': '完整角色卡将包含：HP / Humanity / EMP / 护甲 / 武器 / 技能 / 角色能力 / 植入体（cyberware）。',
};

const SOURCE_LABEL: Record<string, string> = {
  localActorVault: '本地角色库',
  manualScaffold: '手动创建',
  imported: '导入',
  unknown: '未知来源',
};

const ADMISSION_LABEL: Record<string, string> = {
  notSubmitted: '未提交',
  pending: '审核中',
  approved: '已准入',
  rejected: '未通过',
  stale: '需重新确认',
};

const BINDING_LABEL: Record<string, string> = {
  notSubmitted: '未提交',
  pendingHostApproval: '等待主持人通过',
  approved: '已通过',
  rejected: '已拒绝',
};

const READY_LABEL: Record<string, string> = { ready: '已准备', notReady: '未准备' };

function label(map: Record<string, string>, key?: string): string | undefined {
  if (!key) return undefined;
  return map[key] ?? key;
}

function hasCharacter(summary?: RuntimeCharacterSummary | null): summary is RuntimeCharacterSummary {
  return !!summary && typeof summary.displayName === 'string' && summary.displayName.trim() !== '';
}

function IdRow({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' }) {
  const valueTone = tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-slate-800';
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/60 py-1 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{k}</span>
      <span className={`text-right text-[12px] font-bold ${valueTone}`}>{v}</span>
    </div>
  );
}

function StatGrid({ title, stats }: { title: string; stats: RuntimeCharacterStat[] }) {
  return (
    <div className="rounded border border-slate-300/50 bg-white/70 p-2">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</div>
      {stats.length === 0 ? (
        <p className="text-[10px] italic text-slate-400">当前摘要暂无该项数据。</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {stats.map((s, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-slate-500">{s.label}</span>
              <span className="font-bold text-slate-800">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvGroup({ title, items }: { title: string; items: RuntimeInventoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1.5 first:mt-0">
      <div className="text-[10px] font-bold text-slate-600">{title}</div>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="text-slate-700">{it.label}</span>
            {it.detail && <span className="text-right text-[10px] text-slate-400">{it.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RuntimeCharacterSheetPanel({ summary, role, inventory }: RuntimeCharacterSheetPanelProps) {
  if (!hasCharacter(summary)) {
    return (
      <div className="space-y-2 text-left">
        <div className="rounded border border-dashed border-slate-400/40 bg-white/40 p-3 text-[11px] leading-relaxed text-slate-500">
          <div className="mb-1 text-[12px] font-bold text-slate-600">还没有可展示的角色卡</div>
          {role === 'spectator' ? (
            <p>旁观者不绑定角色，因此没有角色卡可显示。</p>
          ) : (
            <p>
              当前房间还没有绑定可展示的角色卡。你仍可以查看公开信息、场景与日志，并等待主持人完成角色准入。
            </p>
          )}
        </div>
        <RuntimeActorBoundaryNote variant="compact" />
      </div>
    );
  }

  const systemLabel = label(SYSTEM_LABEL, summary.system) ?? summary.system ?? '未知系统';
  const systemHint = summary.system ? SYSTEM_SHEET_HINT[summary.system] : undefined;
  const sourceLabel = label(SOURCE_LABEL, summary.source);
  const admissionLabel = label(ADMISSION_LABEL, summary.admissionStatus);
  const bindingLabel = label(BINDING_LABEL, summary.bindingStatus);
  const readyLabel = label(READY_LABEL, summary.readyState);

  const hasAnyStats =
    summary.coreStats.length > 0 ||
    summary.skillHighlights.length > 0 ||
    summary.resourceHighlights.length > 0 ||
    summary.featureHighlights.length > 0 ||
    summary.notes.length > 0;

  return (
    <div className="space-y-2 text-left">
      {/* Header */}
      <div className="rounded border border-slate-300/60 bg-white/70 p-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-black text-slate-800">{summary.displayName}</span>
          <span className="rounded-full border border-slate-400/40 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">只读角色卡</span>
        </div>
        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{systemLabel}</div>
        <div className="mt-2 space-y-0">
          {summary.playerLabel && <IdRow k="玩家 / 席位" v={summary.playerLabel} />}
          <IdRow k="来源" v={sourceLabel ?? '当前房间绑定角色'} />
          {bindingLabel && <IdRow k="绑定" v={bindingLabel} tone={summary.bindingStatus === 'approved' ? 'ok' : 'warn'} />}
          {admissionLabel && <IdRow k="准入" v={admissionLabel} tone={summary.admissionStatus === 'approved' ? 'ok' : 'warn'} />}
          {readyLabel && <IdRow k="准备" v={readyLabel} tone={summary.readyState === 'ready' ? 'ok' : 'warn'} />}
        </div>
      </div>

      {summary.sourceWarnings.length > 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-50/60 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800">
          {summary.sourceWarnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* Character data sections (safe reads; empty states when no data). */}
      {!hasAnyStats ? (
        <div className="rounded border border-slate-300/50 bg-white/60 p-2 text-[10px] leading-relaxed text-slate-500">
          当前摘要暂无角色卡数值。{systemHint ? <> {systemHint}</> : null} 有数据后，这里会显示核心状态、常用检定、资源与装备。
        </div>
      ) : (
        <>
          <StatGrid title="核心状态" stats={summary.coreStats} />
          <StatGrid title="常用检定 / 技能" stats={summary.skillHighlights} />
          <StatGrid title="资源" stats={summary.resourceHighlights} />
          <StatGrid title="特性 / 能力" stats={summary.featureHighlights} />
          {summary.notes.length > 0 && (
            <div className="rounded border border-slate-300/50 bg-white/70 p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">备注 / 特性</div>
              <ul className="list-disc pl-4 text-[11px] text-slate-700">
                {summary.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Read-only inventory / equipment view (M55). */}
      {inventory && (
        <div className="rounded border border-slate-300/50 bg-white/70 p-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">装备 / 背包</div>
          {!inventory.hasAny ? (
            <p className="text-[10px] italic leading-relaxed text-slate-400">
              {inventory.sourceWarnings[0] ?? '当前角色快照还没有提供可展示的装备 / 背包数据。'}
            </p>
          ) : (
            <>
              <InvGroup title="已装备" items={inventory.equipped} />
              <InvGroup title="背包" items={inventory.inventory} />
              <InvGroup title="消耗品 / 资源物品" items={inventory.consumables} />
              <InvGroup title="货币 / 财产" items={inventory.currency} />
            </>
          )}
          <div className="mt-1.5">
            <RuntimeInventoryBoundaryNote variant="compact" />
          </div>
        </div>
      )}

      <RuntimeActorBoundaryNote variant="compact" />
    </div>
  );
}
