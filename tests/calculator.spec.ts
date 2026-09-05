import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function nutrientItems(page: Page) {
  return page.locator('.dri-table tbody tr:visible, .dri-nutrient-card:visible');
}

function nutrient(page: Page, name: string) {
  return nutrientItems(page).filter({ has: page.getByRole('heading', { name, exact: true }).or(page.getByRole('rowheader', { name: new RegExp(`^${name}\\b`) })) });
}

async function enterChild(page: Page) {
  await page.locator('#weight').fill('25');
  await page.locator('#height').fill('122');
  await page.getByRole('radio', { name: 'Male', exact: true }).check();
  await page.locator('#age-years').fill('7');
  await page.locator('#age-months').fill('0');
  await page.locator('#activity').selectOption('active');
}

async function calculate(page: Page) {
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('nutrition displays sourced daily totals and substituted work', async ({ page }) => {
  await enterChild(page);
  await calculate(page);
  const results = page.getByLabel('Nutrition results');
  await expect(results).toContainText('1,709');
  await expect(results).toContainText('23.8');
  await expect(results).toContainText('1,600');
  // 1708.59 / 25 = 68.3436. Round only for display, not before division.
  await expect(results).toContainText('68.34');
  const energy = results.locator('article').filter({ has: page.getByRole('heading', { name: 'Energy', exact: true }) });
  await energy.locator('summary').click();
  await expect(energy).toContainText('1708.59');
  await expect(energy.getByRole('link', { name: /Health Canada/ })).toHaveAttribute('href', /canada\.ca/);
});

test('changing a patient never leaves an old calculation presented as current', async ({ page }) => {
  await enterChild(page);
  await calculate(page);
  await expect(page.getByLabel('Nutrition results')).toBeVisible();
  await page.locator('#weight').fill('30');
  // Once calculated, the UI recomputes immediately from shared inputs.
  await expect(page.getByLabel('Nutrition results')).not.toContainText('1,709');
  await expect(page.getByLabel('Nutrition results')).toContainText('1,811');
  await expect(page.getByLabel('Nutrition results')).toContainText('1,700');
});

test('DRI lookup needs only age and sex, and preserves sex-specific reference values', async ({ page }) => {
  await page.locator('#age-years').fill('12');
  await page.getByRole('radio', { name: 'Female', exact: true }).check();
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  const manganese = nutrient(page, 'Manganese');
  await expect(manganese).toContainText('1.6');
  const chromium = nutrient(page, 'Chromium');
  await expect(chromium).toContainText('21');
  await expect(chromium).toContainText('Not established');
  await page.getByRole('searchbox', { name: 'Find a nutrient' }).fill('Vitamin D');
  await expect(nutrientItems(page)).toHaveCount(1);
  await expect(nutrientItems(page)).toContainText('15');
});

test('growth supports a single measurement and shows its work and actual chart', async ({ page }) => {
  await page.getByRole('tab', { name: /Z.score/i }).click();
  if (await page.getByRole('button', { name: 'Use dates', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Use dates', exact: true }).click();
  }
  await page.locator('#dob').fill('2025-10-11');
  await page.locator('#measurement-date').fill('2026-02-11');
  await page.locator('#weight').fill('5');
  await page.getByRole('radio', { name: 'Male', exact: true }).check();
  await calculate(page);
  const weight = page.locator('.growth-metric').filter({ hasText: 'Weight for age' });
  await expect(weight.getByRole('button')).toBeVisible();
  await expect(weight).toContainText('percentile');
  await expect(page.getByRole('img', { name: /Weight for age growth/ })).toBeVisible();
  await expect(weight).toContainText('-2.93');
  await expect(weight).toContainText('0.2');
  await page.getByText('Show z-score calculation', { exact: true }).click();
  await expect(page.locator('.chart-shell')).toContainText('WHO');
  await expect(page.locator('.chart-shell')).toContainText('123');
});

test('reset clears all patient values and calculations across tools', async ({ page }) => {
  await enterChild(page);
  await calculate(page);
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  await expect(nutrientItems(page)).toHaveCount(26);
  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  await expect(page.locator('#weight')).toHaveValue('');
  await expect(page.locator('#height')).toHaveValue('');
  await expect(page.getByRole('radio', { name: 'Male', exact: true })).not.toBeChecked();
  await expect(nutrientItems(page)).toHaveCount(0);
  await page.getByRole('tab', { name: 'Nutrition', exact: true }).click();
  await expect(page.getByLabel('Nutrition results')).toHaveCount(0);
});

test('invalid inputs show useful errors without numeric results', async ({ page }) => {
  await calculate(page);
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByLabel('Nutrition results')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('Infinity');
});

test('unfinished age input cannot silently select an infant reference', async ({ page }) => {
  await enterChild(page);
  await page.locator('#age-months').fill('6');
  await calculate(page);
  await page.locator('#age-years').fill('1e');
  await expect(page.getByLabel('Nutrition results')).toHaveCount(0);
  await expect(page.locator('#age-years')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  await expect(nutrientItems(page)).toHaveCount(0);
  await expect(page.getByRole('alert').first()).toBeVisible();
  await page.locator('#age-years').fill('7');
  await expect(nutrientItems(page)).toHaveCount(26);
});

test('production makes no runtime requests or storage writes while calculating', async ({ page, context }) => {
  const runtimeRequests: string[] = [];
  page.on('request', (request) => runtimeRequests.push(request.url()));
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new Error('Unexpected storage write'); } });
    Object.defineProperty(indexedDB, 'open', { value: () => { throw new Error('Unexpected database'); } });
  });
  await context.setOffline(true);
  await enterChild(page);
  await calculate(page);
  await expect(page.getByLabel('Nutrition results')).toContainText('1,709');
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  await expect(nutrientItems(page)).toHaveCount(26);
  expect(runtimeRequests).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }))).toEqual({ local: 0, session: 0, cookies: '' });
});

test('light and dark screens pass accessibility and viewport checks', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.reload();
    await enterChild(page);
    await calculate(page);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    const size = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(size.document).toBeLessThanOrEqual(size.viewport);
    await page.getByRole('tab', { name: /DRI/ }).click();
    await page.getByRole('button', { name: 'View reference', exact: true }).click();
    const tableAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(tableAudit.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test('tabs work with a keyboard', async ({ page }) => {
  const nutrition = page.getByRole('tab', { name: 'Nutrition', exact: true });
  await nutrition.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Z.score/i })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /DRI/ })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(nutrition).toBeFocused();
});

test('growth requires an explicit posture and oedema withholds only weight-related metrics', async ({ page }) => {
  await enterChild(page);
  await page.getByRole('tab', { name: /Z.score/i }).click();
  await page.locator('#dob').fill('2019-02-11');
  await page.locator('#measurement-date').fill('2026-02-11');
  await expect(page.locator('#measurement-type')).toHaveValue('');
  await calculate(page);
  const height = page.locator('.growth-metric').filter({ hasText: 'Height for age' });
  const weight = page.locator('.growth-metric').filter({ hasText: 'Weight for age' });
  await expect(height).toContainText('Choose how height or length was measured');
  await expect(weight.getByRole('button')).toBeVisible();
  await page.locator('#measurement-type').selectOption('height');
  await expect(height.getByRole('button')).toBeVisible();
  const originalHeight = (await height.textContent())!;
  const originalWeight = (await weight.textContent())!;
  await page.getByText('Additional measurement information', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Bilateral pitting oedema is present' }).check();
  await expect(weight).toContainText('not calculated when oedema is present');
  await expect(height).toHaveText(originalHeight);
  await expect(page.locator('.growth-metric').filter({ hasText: 'BMI for age' })).toContainText('not calculated when oedema is present');
  await page.getByRole('checkbox', { name: 'Bilateral pitting oedema is present' }).uncheck();
  await expect(weight).toHaveText(originalWeight);
  await page.locator('#dob').fill('2014-02-11');
  await expect(weight).toContainText('Unavailable');
  await expect(height.getByRole('button')).toBeVisible();
});

test('six-month infant exception and upper-limit units are visible where needed', async ({ page }) => {
  await page.locator('#age-months').fill('6');
  await page.locator('#weight').fill('7');
  await page.locator('#height').fill('65');
  await page.getByRole('radio', { name: 'Female', exact: true }).check();
  await calculate(page);
  await expect(page.getByText(/NASEM overview describes two six-month infant intervals/)).toBeVisible();
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  await expect(page.getByText(/Calcium and vitamin D use the older-infant values/)).toBeVisible();
  const calcium = nutrient(page, 'Calcium');
  await expect(calcium).toContainText('260');
  await page.locator('#age-years').fill('7');
  await page.locator('#age-months').fill('0');
  const folate = nutrient(page, 'Folate');
  await expect(folate).toContainText('DFE');
  await expect(folate).toContainText('folic acid');
});

test('growth charts remain accessible in both themes without page overflow', async ({ page }) => {
  await page.getByRole('tab', { name: /Z.score/i }).click();
  await page.locator('#dob').fill('2025-10-11');
  await page.locator('#measurement-date').fill('2026-02-11');
  await page.locator('#weight').fill('5');
  await page.locator('#height').fill('60');
  await page.locator('#head-circumference').fill('39');
  await page.locator('#measurement-type').selectOption('length');
  await page.getByRole('radio', { name: 'Male', exact: true }).check();
  await calculate(page);
  for (const dark of [false, true]) {
    if (dark) await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.getByRole('radio', { name: 'Weight / length or height', exact: true }).check();
    await page.locator('.growth-metric').filter({ hasText: 'Weight for length' }).getByRole('button').click();
    await expect(page.getByRole('img', { name: /Weight for length growth/ })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test('downloaded HTML starts with networking blocked, calculates in all tabs, and clears on reload', async ({ page, context }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (entry) => { if (entry.type() === 'error') errors.push(entry.text()); });
  // WebKit's network-offline emulation rejects file: navigation itself. Blocking
  // HTTP(S) before opening the file tests the actual artifact in both engines.
  await context.route(/^https?:/, (route) => route.abort('internetdisconnected'));
  await page.goto(pathToFileURL(resolve('dist/little-spoon.html')).href);
  await enterChild(page);
  await calculate(page);
  await expect(page.getByLabel('Nutrition results')).toContainText('1,709');
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  await expect(nutrientItems(page)).toHaveCount(26);
  await page.getByRole('tab', { name: /Z.score/i }).click();
  await page.locator('#dob').fill('2019-02-11');
  await page.locator('#measurement-date').fill('2026-02-11');
  await page.locator('#measurement-type').selectOption('height');
  await calculate(page);
  await expect(page.getByRole('img', { name: /Weight for age growth/ })).toBeVisible();
  await page.getByText('Software licences', { exact: true }).click();
  await expect(page.getByLabel('Software licence text')).toContainText('GNU GENERAL PUBLIC LICENSE');
  await page.reload();
  await expect(page.locator('#weight')).toHaveValue('');
  await expect(page.locator('#age-years')).toHaveValue('');
  await expect(page.getByRole('radio', { name: 'Male', exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Nutrition results')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});


test('phone date controls remain separate and keep entered dates when resized and focused', async ({ page }) => {
  await page.getByRole('button', { name: 'Use dates', exact: true }).click();
  await page.locator('#dob').fill('2019-12-31');
  await page.locator('#measurement-date').fill('2026-02-11');
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 720 });
    for (const id of ['dob', 'measurement-date']) {
      const field = page.locator(`#${id}`);
      await field.focus();
      await expect(field).toBeFocused();
      const geometry = await field.evaluate((input) => {
        const rect = input.getBoundingClientRect();
        const parent = input.parentElement!.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height,
          parentLeft: parent.left, parentRight: parent.right,
          fontSize: parseFloat(getComputedStyle(input).fontSize) };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(geometry.parentLeft - 1);
      expect(geometry.right).toBeLessThanOrEqual(geometry.parentRight + 1);
      expect(geometry.height).toBeGreaterThanOrEqual(44);
      expect(geometry.fontSize).toBeGreaterThanOrEqual(16);
    }
    const birth = (await page.locator('#dob').boundingBox())!;
    const measurement = (await page.locator('#measurement-date').boundingBox())!;
    expect(birth.y + birth.height).toBeLessThanOrEqual(measurement.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('#dob')).toHaveValue('2019-12-31');
    await expect(page.locator('#measurement-date')).toHaveValue('2026-02-11');
    await expect(page.locator('.age-calculated')).toHaveText('6 yr 1 mo (2,234 days)');
  }
});

test('phone nutrient references show complete values and notes without sideways scrolling', async ({ page }) => {
  await page.locator('#age-years').fill('7');
  await page.getByRole('radio', { name: 'Female', exact: true }).check();
  await page.getByRole('tab', { name: /DRI/ }).click();
  await page.getByRole('button', { name: 'View reference', exact: true }).click();
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 720 });
    await expect(nutrientItems(page)).toHaveCount(26);
    await expect(page.getByRole('table')).toHaveCount(0);
    const folate = page.getByRole('article', { name: 'Folate', exact: true });
    await expect(folate).toBeVisible();
    await expect(folate.locator('dd').nth(0)).toContainText('200');
    await expect(folate.locator('dd').nth(0)).toContainText('µg DFE');
    await expect(folate.locator('dd').nth(1)).toContainText('400');
    await expect(folate.locator('dd').nth(1)).toContainText('µg folic acid');
    await folate.locator('summary').click();
    await expect(folate.getByRole('link', { name: /Health Canada/ })).toBeVisible();
    const overflow = await page.locator('.dri-panel').evaluate((panel) =>
      [panel, ...panel.querySelectorAll('*')].filter((element) =>
        element.getClientRects().length && !element.classList.contains('sr-only') &&
        element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1
      ).map((element) => element.className));
    expect(overflow).toEqual([]);
    await folate.locator('summary').click();
    await page.getByRole('searchbox', { name: 'Find a nutrient' }).fill('Folate');
    await expect(nutrientItems(page)).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Nutrient group' }).selectOption('Mineral');
    await expect(nutrientItems(page)).toHaveCount(0);
    await expect(page.getByText('No nutrients match', { exact: false })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Find a nutrient' }).fill('');
    await page.getByRole('combobox', { name: 'Nutrient group' }).selectOption('all');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('table')).toBeVisible();
  await expect(nutrientItems(page)).toHaveCount(26);
  await expect(page.getByRole('article', { name: 'Folate', exact: true })).toHaveCount(0);
});
