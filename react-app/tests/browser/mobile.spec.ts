import { expect, test, type Page } from '@playwright/test';
import { selectSvgLabel } from './svgInput';

test('maritime context fits narrow screens and keeps touch navigation usable', async ({ page }, info) => {
  await page.goto('/?review=maritime');
  await expect(page.locator('[data-water-label]').first()).toBeVisible();
  await expect(page.locator('[data-eez-outline], [data-par-outline], [data-maritime-legend]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.waitForFunction(() => [...document.querySelectorAll('.map-feature, .map-label')].every(node => getComputedStyle(node).opacity === '1'));
  const collisions = await page.evaluate(() => {
    const administrative = [...document.querySelectorAll('.map-label')].map(node => node.getBoundingClientRect());
    return [...document.querySelectorAll('[data-water-label]')].filter(node => {
      const box = node.getBoundingClientRect();
      return administrative.some(other => Math.min(box.right, other.right) - Math.max(box.left, other.left) > 0 && Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) > 0);
    }).map(node => node.getAttribute('data-water-label'));
  });
  expect(collisions).toEqual([]);
  await page.screenshot({ path: info.outputPath('maritime-mobile.png') });
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await page.locator('path[data-psgc="1800000000"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/1800000000');
  await expect(page.locator('[data-eez-outline]')).toHaveCount(0);
});

test('official NIR PSGC links retain touch navigation on phones and tablets', async ({ page }) => {
  await page.goto('/#/region/1800000000/province/1804500000/municity/1830200000');
  await ready(page, '#/region/1800000000/province/604500000/municity/630200000');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('[data-profile-key="municity:1830200000"]')).toBeVisible();
  await expect(page.locator('#detail-lgu-name')).toContainText('Bacolod');
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await page.locator('#back-btn').tap();
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/1800000000/province/604500000');
  await page.locator('#back-btn').tap();
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/1800000000');
});

test('Sulu saved links and touch Back controls use Region IX on phones and tablets', async ({ page }) => {
  await page.goto('/#/region/1900000000/province/1906600000/municity/1906602000');
  await ready(page, '#/region/900000000/province/1906600000/municity/1906602000');
  await expect(page.locator('path[data-psgc]')).toHaveCount(8);
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('[data-profile-key="municity:0906602000"]')).toBeVisible();
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/900000000/province/1906600000/municity/1906602000');
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await page.locator('#back-btn').tap();
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/900000000/province/1906600000');
  await expect(page.locator('#back-btn')).toContainText('Region IX');
  await page.locator('#back-btn').tap();
  await expect(page.locator('path[data-psgc="1906600000"]')).toBeVisible();
  await page.goto('/#/region/1900000000');
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/1900000000');
  await expect(page.locator('path[data-psgc="1906600000"]')).toHaveCount(0);
});

test('municipal profile fits a 320px drawer and scrolls without moving the map', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/region/900000000/province/907200000/municity/907203000');
  await ready(page, '#/region/900000000/province/907200000/municity/907203000');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  const article = page.locator('[data-profile-key="municity:0907203000"]');
  await expect(article).toBeVisible();
  await expect(page.locator('#detail')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(article).toContainText('43,427');
  const body = page.locator('#detail-body');
  expect(await body.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  const header = await page.locator('#detail-header').boundingBox();
  const transform = await page.locator('svg > g').getAttribute('transform');
  await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.locator('#detail-header').boundingBox()).toEqual(header);
  await expect(page.locator('svg > g')).toHaveAttribute('transform', transform!);
  await page.screenshot({ path: info.outputPath('municipal-profile-narrow.png') });
});

for (const [name, hash, count] of [
  ['Cebu City', '#/region/700000000/province/702200000/municity/730600000', 80],
  ['Davao City', '#/region/1100000000/province/1102400000/municity/1130700000', 182],
] as const) {
  test(`${name} barangay mobile review loads one file and supports touch selection`, async ({ page }, info) => {
    const requests: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('bgysubmuns')) requests.push(request.url()); });
    await page.goto('/' + hash);
    await ready(page, hash);
    await expect(page.locator('path[data-psgc]')).toHaveCount(count);
    await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('#status')).toHaveText(`${count} barangays`);
    await settledMap(page);
    const first = page.locator('[data-label-name]').first();
    const code = await first.getAttribute('data-label-psgc');
    const name = await first.getAttribute('data-label-name');
    await selectSvgLabel(page, `[data-label-psgc="${code}"]`, true);
    await expect(page.locator('#status')).toHaveText(name!);
    await expect(page.locator(`path[data-psgc="${code}"]`)).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('barangay-mobile.png') });
    await page.locator('#back-btn').tap();
    await ready(page, hash.split('/municity/')[0]);
    expect(requests).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test('pilot profile scrolls independently at 320px while header and parent navigation remain usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/region/900000000'); await ready(page, '#/region/900000000');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('#detail')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.waitForFunction(() => [...document.querySelectorAll('.map-feature, .map-label, .map-boundaries')].every(node => getComputedStyle(node).opacity === '1'));
  const header = await page.locator('#detail-header').boundingBox();
  await expect(page.locator('[data-profile-key="region:0900000000"]')).toBeVisible();
  expect(await page.locator('#detail-body').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('profile-narrow-top.png') });
  // Scroll to the source list and verify the panel's independent scroll container.
  const mapTransform = await page.locator('svg > g').getAttribute('transform');
  const body = page.locator('#detail-body');
  await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.locator('#detail-header').boundingBox()).toEqual(header);
  await expect(page.locator('svg > g')).toHaveAttribute('transform', mapTransform!);
  await expect(page.locator('#detail-close')).toBeVisible();
  await page.screenshot({ path: info.outputPath('profile-narrow-sources.png') });
  await page.locator('#detail-close').tap();
  await page.locator('#back-btn').tap(); await ready(page, '#/');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('[data-profile-key="national"]')).toBeVisible();
  await expect.poll(() => body.evaluate(node => node.scrollTop)).toBe(0);
  await page.locator('#detail-close').tap();
  await tapPolygon(page, '1300000000'); await ready(page, '#/region/1300000000');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('[data-profile-key="region:1300000000"]')).toBeVisible();
  await expect(page.locator('[data-profile-key="region:0900000000"]')).toHaveCount(0);
});

async function ready(page: Page, hash: string) {
  await expect(page.locator('svg')).toHaveAttribute('data-view', hash);
  await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
}
async function settledMap(page: Page) {
  // DOM readiness precedes label reveal and the drawer's closing transition.
  // Capture the steady interface rather than an intermediate animation frame.
  await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
  await page.waitForFunction(() => [...document.querySelectorAll('.map-feature, .map-label, .map-boundaries')]
    .every(element => getComputedStyle(element).opacity === '1'));
}
async function tapPolygon(page: Page, code: string) {
  await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
  // geoPath centroid can land outside concave/island polygons. Choose an actual
  // hit-test point inside the path, then send a real touchscreen tap there.
  const point = await page.locator(`path[data-psgc="${code}"]`).evaluate(element => {
    const box = element.getBoundingClientRect();
    for (let y = box.y + 2; y < box.bottom; y += Math.max(2, box.height / 20)) {
      for (let x = box.x + 2; x < box.right; x += Math.max(2, box.width / 20)) {
        if (document.elementFromPoint(x, y) === element) return { x, y };
      }
    }
    throw new Error('No visible hit point for ' + element.getAttribute('data-psgc'));
  });
  await page.touchscreen.tap(point.x, point.y);
}

test('touch drilldown, city reload and parent navigation work on phones/tablets', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await ready(page, '#/');
  await expect(page.getByRole('button', { name: 'Open details menu' })).toBeVisible();
  await tapPolygon(page, '900000000');
  await ready(page, '#/region/900000000');
  await tapPolygon(page, '907200000');
  const province = '#/region/900000000/province/907200000';
  await ready(page, province);
  await selectSvgLabel(page, 'text[data-label-psgc="907201000"]', true);
  await ready(page, province + '/municity/907201000');
  await page.getByRole('button', { name: 'Open details menu' }).tap();
  await expect(page.locator('#detail-lgu-name')).toHaveText('City of Dapitan');
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await page.reload();
  await ready(page, province + '/municity/907201000');
  await page.locator('#back-btn').tap();
  await ready(page, province);
  await settledMap(page);
  await page.screenshot({ path: info.outputPath('touch-province.png') });
  expect(errors).toEqual([]);
});

test('narrow layout keeps hamburger and long parent Back button independently tappable', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/region/900000000/province/907200000');
  await ready(page, '#/region/900000000/province/907200000');
  const menu = page.getByRole('button', { name: 'Open details menu' });
  const back = page.locator('#back-btn');
  const menuBox = (await menu.boundingBox())!, backBox = (await back.boundingBox())!;
  expect(backBox.x).toBeGreaterThanOrEqual(menuBox.x + menuBox.width + 4);
  await menu.tap();
  await expect(page.getByRole('complementary', { name: 'Location details', exact: true })).toHaveCSS('width', '320px');
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await back.tap();
  await ready(page, '#/region/900000000');
  await settledMap(page);
  await page.screenshot({ path: info.outputPath('narrow-controls.png') });
});

test('orientation changes, touch panning and NCR city navigation keep the map usable', async ({ page }, info) => {
  await page.goto('/#/region/1300000000');
  await ready(page, '#/region/1300000000');
  await expect(page.locator('path[data-psgc]')).toHaveCount(17);
  for (const [width, height] of [[844, 390], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('svg')).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  // Synthesized touch events exercise D3's touch listeners, rather than its
  // mouse-only drag path. Touch taps above use Playwright's native touchscreen.
  const svg = page.locator('svg');
  await svg.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: 500, clientY: 200, pageX: 500, pageY: 200 }], changedTouches: [{ identifier: 1, clientX: 500, clientY: 200, pageX: 500, pageY: 200 }] });
  await svg.dispatchEvent('touchmove', { touches: [{ identifier: 1, clientX: 540, clientY: 220, pageX: 540, pageY: 220 }], changedTouches: [{ identifier: 1, clientX: 540, clientY: 220, pageX: 540, pageY: 220 }] });
  await svg.dispatchEvent('touchend', { touches: [], changedTouches: [{ identifier: 1, clientX: 540, clientY: 220, pageX: 540, pageY: 220 }] });
  await expect(page.locator('svg > g')).not.toHaveAttribute('transform', 'translate(0,0) scale(1)');
  await tapPolygon(page, '1380600000');
  await ready(page, '#/region/1300000000/municity/1380600000');
  await page.getByRole('button', { name: 'Close details menu' }).tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(svg).toHaveAttribute('viewBox', '0 0 390 844');
  await expect(page.locator('svg > g')).toHaveAttribute('transform', 'translate(0,0) scale(1)');
  await settledMap(page);
  await page.screenshot({ path: info.outputPath('ncr-city-portrait.png') });
});
