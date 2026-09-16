import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

/** Production components with the existing deterministic room transport fixture.
 * This suite is not evidence of a real multiplayer human pilot. */
export async function verifyActionClarity(browser, origin, output) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (name, value) => { assert.ok(value, name); checks.push(name); };
  const go = async query => {
    await page.goto(`${origin}/tests/live-play/?${query}`);
    await page.locator('[data-live-play]').waitFor();
  };
  const actor = () => page.getByRole('combobox', { name: '控制角色 / NPC', exact: true });
  const target = () => page.getByRole('combobox', { name: '攻击目标', exact: true });
  const attack = () => page.getByRole('button', { name: '攻击', exact: true });
  const summary = () => page.locator('[data-attack-summary]');
  await fs.mkdir(output, { recursive: true });
  try {
    await go('role=host');
    await actor().selectOption('c3');
    await target().selectOption('c0');
    await page.waitForFunction(() => document.querySelector('[data-attack-summary]')?.textContent?.includes('地精斥候 → 短剑 → 艾拉'));
    check('host actor/action/target summary matches selection', (await summary().innerText()).includes('地精斥候 → 短剑 → 艾拉'));
    await page.locator('[data-map-token="t4"]').click();
    check('map target selection does not change acting host combatant', await actor().inputValue() === 'c3' && await target().inputValue() === 'c4');
    await target().selectOption('c3');
    check('self target is explicit without inventing a prohibition', (await summary().innerText()).includes('目标是行动角色自身') && await attack().isEnabled());
    await target().selectOption('c0');
    await attack().click();
    await page.locator('[data-previous-attack-result] .live-attack-result').waitFor();
    check('confirmed result has a history label', (await page.locator('[data-previous-attack-result] summary').first().innerText()).includes('历史结果'));
    await page.evaluate(() => {
      const original = window.fetch;
      window.fetch = async (input, init) => String(input).includes('/runtime/dnd-attack')
        ? new Response(JSON.stringify({ error: 'dnd_attack_out_of_range' }), { status: 409, headers: { 'Content-Type': 'application/json' } })
        : original(input, init);
    });
    await attack().click();
    await page.getByText('本次攻击请求被拒绝', { exact: true }).waitFor();
    check('success then rejection collapses previous result', !(await page.locator('[data-previous-attack-result]').evaluate(element => element.open)));
    check('rejection is localized and does not append a fixture event', (await page.locator('[data-attack-error]').innerText()).includes('目标超出此攻击的近战范围') && await page.evaluate(() => window.uxFixture.events.filter(e => e.kind === 'combat.attack_resolved').length) === 1);
    await page.screenshot({ path: `${output}/host-rejection.png` });
    await actor().selectOption('c1');
    check('rejection keeps original actor after changing selection', (await page.locator('[data-attack-error]').innerText()).includes('地精斥候'));

    await go('role=host&retry');
    await actor().selectOption('c3');
    await target().selectOption('c0');
    await attack().click();
    await page.getByText('本次攻击结果尚未确认', { exact: true }).waitFor();
    await page.locator('.live-initiative button').filter({ hasText: '索恩' }).click();
    await page.locator('[data-map-token="t4"]').click();
    check('parent actor/target changes cannot retarget pending intent', await actor().inputValue() === 'c3' && await target().inputValue() === 'c0');
    check('pending summary never borrows new actor action label', (await summary().innerText()).includes('地精斥候 → 待确认动作 → 艾拉'));
    check('pending controls remain disabled', await actor().isDisabled() && await target().isDisabled() && await attack().isDisabled());
    await page.getByRole('button', { name: '重试同一攻击', exact: true }).click();
    await page.getByText('已恢复原始结果。', { exact: true }).waitFor();
    check('retry resends identical intent and applies once', await page.evaluate(() => {
      const { intents, events } = window.uxFixture;
      return intents.length === 2 && JSON.stringify(intents[0]) === JSON.stringify(intents[1]) && events.filter(e => e.kind === 'combat.attack_resolved').length === 1;
    }));

    await go('role=player&empty');
    await page.locator('[data-empty-attack-guidance]').waitFor();
    check('player guidance explains equipment plus host acceptance', (await page.locator('[data-empty-attack-guidance]').innerText()).includes('请主持人复核接受'));
    check('player has no host character selector', await actor().count() === 0);
    await page.getByRole('button', { name: '查看已准入角色', exact: true }).click();
    check('guidance opens existing character panel', await page.locator('.live-context-panel').isVisible());
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '返回大厅更新角色', exact: true }).click();
    check('guidance returns to existing lobby', await page.locator('[data-live-play]').count() === 0);

    await page.setViewportSize({ width: 390, height: 844 });
    await go('role=player');
    await target().selectOption('c3');
    await attack().focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-previous-attack-result]').waitFor();
    check('keyboard activates authoritative-intent submission', await page.evaluate(() => window.uxFixture.intents.length === 1 && window.uxFixture.intents[0].actorCombatantId === 'c0'));
    check('mobile action controls stay within viewport', await page.locator('[data-live-attack]').evaluate(element => [...element.querySelectorAll('select,button,[data-attack-summary]')].filter(e => e.getClientRects().length).every(e => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight; })));
    await page.screenshot({ path: `${output}/player-mobile.png` });

    await go('role=spectator');
    check('spectator has no attack submission controls', await page.locator('[data-live-attack]').count() === 0 && await actor().count() === 0);
    check('no browser runtime exceptions', errors.length === 0);
    const result = { status: 'passed', kind: 'deterministic browser integration', checks, errors };
    await fs.writeFile(`${output}/browser-results.json`, JSON.stringify(result, null, 2) + '\n');
    return result;
  } finally { await context.close(); }
}
