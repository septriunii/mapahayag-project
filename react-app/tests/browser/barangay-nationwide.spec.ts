import { expect, test } from '@playwright/test';

test('partial barangay coverage remains visible after selecting a name', async ({ page }) => {
  await page.goto('/#/region/900000000/province/908300000/municity/908304000');
  await expect(page.locator('path[data-psgc]')).toHaveCount(18);
  await expect(page.locator('#status')).toHaveText('18 barangays · 1 of 19 barangay boundaries unavailable');
  const feature = page.locator('path[data-psgc]').first();
  const name = await feature.getAttribute('aria-label');
  await feature.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toHaveText(`${name} · 1 of 19 barangay boundaries unavailable`);
});

test('Calaca stays at city level when barangay boundaries are unavailable', async ({ page }) => {
  const hash = '#/region/400000000/province/401000000/municity/401007000';
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('bgysubmuns')) requests.push(request.url()); });
  await page.goto('/' + hash);
  await expect(page.locator('svg')).toHaveAttribute('data-view', hash);
  await expect(page.locator('path[data-psgc]')).toHaveCount(1);
  await expect(page.locator('path[data-psgc="401007000"]')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Barangay boundaries unavailable');
  expect(requests).toEqual([]);
});
