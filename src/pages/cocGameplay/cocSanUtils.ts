export type CocSanLossRoll = {
  expression: string;
  rolls: number[];
  total: number;
  detail: string;
};

type ParsedSanLossTerm =
  | { kind: 'fixed'; value: number; expression: string }
  | { kind: 'dice'; count: number; sides: number; expression: string };

function parseSanLossTerm(raw: string): ParsedSanLossTerm | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    return {
      kind: 'fixed',
      value: Math.max(0, Number.parseInt(normalized, 10)),
      expression: normalized,
    };
  }

  const diceMatch = normalized.match(/^(\d*)d(\d+)$/);
  if (!diceMatch) return null;

  const count = diceMatch[1] ? Number.parseInt(diceMatch[1], 10) : 1;
  const sides = Number.parseInt(diceMatch[2], 10);
  if (!Number.isFinite(count) || !Number.isFinite(sides) || count < 1 || sides < 1) {
    return null;
  }

  return {
    kind: 'dice',
    count,
    sides,
    expression: `${count}d${sides}`,
  };
}

export function parseCocGameplaySanLossExpression(expr: string): {
  success: ParsedSanLossTerm;
  failure: ParsedSanLossTerm;
} | null {
  const parts = expr.trim().split('/').map(part => part.trim());
  if (parts.length === 0 || parts.length > 2) return null;

  const success = parseSanLossTerm(parts[0] ?? '');
  const failure = parseSanLossTerm(parts[1] ?? parts[0] ?? '');
  if (!success || !failure) return null;

  return { success, failure };
}

export function rollCocGameplaySanLoss(
  expr: string,
  succeeded: boolean,
): CocSanLossRoll | null {
  const parsed = parseCocGameplaySanLossExpression(expr);
  if (!parsed) return null;

  const term = succeeded ? parsed.success : parsed.failure;
  if (term.kind === 'fixed') {
    return {
      expression: term.expression,
      rolls: [],
      total: term.value,
      detail: `${term.expression} = ${term.value}`,
    };
  }

  const rolls = Array.from({ length: term.count }, () => Math.floor(Math.random() * term.sides) + 1);
  const total = rolls.reduce((sum, roll) => sum + roll, 0);

  return {
    expression: term.expression,
    rolls,
    total,
    detail: `${term.expression}[${rolls.join(', ')}] = ${total}`,
  };
}
