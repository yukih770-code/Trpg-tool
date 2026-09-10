import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { cryptoDndUnitInterval } from './declareDndAttack.js';

function source(path: string) {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
}
function imports(path: string) {
  return source(path).statements.filter(ts.isImportDeclaration).map((item) => (item.moduleSpecifier as ts.StringLiteral).text);
}
const resolver = imports('server/services/resolveDndAttackAction.ts');
assert.ok(resolver.every((path) => path.startsWith('../../src/lib/')), 'pure resolver imports only rule helpers and data types');
assert.ok(!resolver.some((path) => /registry|repository|transport|equipment|gameplay/i.test(path)));
assert.ok(!imports('server/services/applyRuntimeResolution.ts').some((path) => /dnd|dice|weapon|equipment/i.test(path)), 'kernel does not import system rules');
const replay = source('src/lib/combat/combatRuntimeReplay.ts');
assert.ok(!imports(replay.fileName).some((path) => /dice|resolver|crypto|random|equipment/i.test(path)));
function visit(node: ts.Node) {
  if (ts.isCallExpression(node)) assert.doesNotMatch(node.expression.getText(replay), /random|roll|resolv/i, 'replay only assigns stored facts');
  ts.forEachChild(node, visit);
}
visit(replay);
const kernel = source('server/services/applyRuntimeResolution.ts');
const producer = kernel.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'appendResolvedRuntimeEvent');
assert.ok(producer && ts.isFunctionDeclaration(producer));
assert.ok(!producer.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword), 'resolved append producer stays private');
assert.ok(!imports('src/components/platform/RuntimeDndActionPanel.tsx').some((path) => /diceRoller|combatComfort|resolver|gameplay/i.test(path)), 'UI imports no attack rules');
for (let i = 0; i < 256; i++) {
  const value = cryptoDndUnitInterval();
  assert.ok(Number.isFinite(value) && value >= 0 && value < 1);
  assert.ok(Number.isInteger(value * 2 ** 32));
}
console.log('T12 boundary smoke passed: pure resolver imports, system-neutral kernel, RNG/rules-free replay, private append producer, intent-only UI and crypto adapter domain.');
