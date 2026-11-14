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

test('Calaca opens all 39 barangays including the merged Dacanlao', async ({ page }) => {
  const province = '#/region/400000000/province/401000000';
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('bgysubmuns')) requests.push(request.url()); });
  await page.goto('/' + province);
  await expect(page.locator('svg')).toHaveAttribute('data-view', province);
  await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
  await page.locator('path[data-psgc="401007000"]').press('Enter');
  await expect(page.locator('svg')).toHaveAttribute('data-view', province + '/municity/401007000');
  await expect(page.locator('path[data-psgc]')).toHaveCount(39);
  await expect(page.locator('path[data-psgc="401007038"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Dacanlao', exact: true }).press('Enter');
  await expect(page.locator('#status')).toHaveText('Dacanlao');
  await page.locator('#back-btn').click();
  await expect(page.locator('svg')).toHaveAttribute('data-view', province);
  expect(requests.map(url => new URL(url).pathname)).toEqual([
    '/geo-supplemental/bgysubmuns-municity-401007000.0.01.json',
  ]);
});
