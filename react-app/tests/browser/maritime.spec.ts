import { expect, test } from '@playwright/test';

test('sea labels retain drilldown without boundary outlines, legends or geographic downloads', async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/?review=sea-labels');
  await expect(page.locator('[data-water-label="philippine"]')).toBeVisible();
  await expect(page.locator('[data-water-label="sulu"]')).toBeVisible();
  await expect(page.locator('[data-maritime-layer]')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('[data-eez-outline], [data-par-outline], [data-baseline-outline], [data-maritime-legend]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close details menu' }).click();
  await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
  await page.waitForFunction(() => [...document.querySelectorAll('.map-feature, .map-label')].every(node => getComputedStyle(node).opacity === '1'));
  await page.screenshot({ path: info.outputPath('sea-labels-national.png') });
  await page.locator('path[data-psgc="1800000000"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/1800000000');
  await page.locator('#back-btn').click();
  await expect(page.locator('[data-water-label="philippine"]')).toBeVisible();
  expect(requests.filter(url => url.includes('/maritime/') || /arcgis\\.com|namria\\.gov\\.ph/.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test('local sea names appear after native map zoom without overlapping administrative text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Close details menu' }).click();
  await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('[data-water-label="bohol"]')).toHaveCount(0);
  const point = await page.locator('svg').evaluate(svg => {
    const box = svg.getBoundingClientRect();
    const scale = Math.min((box.width - 60) / 19, (box.height - 60) / 23);
    return { x: box.x + (box.width - 19 * scale) / 2 + (124 - 112.2) * scale,
      y: box.y + (box.height - 23 * scale) / 2 + (25.3 - 9.15) * scale };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -1500);
  await expect(page.locator('[data-water-label="bohol"]')).toBeVisible();
  const box = await page.locator('[data-water-label="bohol"]').boundingBox();
  expect(box!.x).toBeGreaterThan(0);
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.x + box!.width).toBeLessThan(page.viewportSize()!.width);
});
