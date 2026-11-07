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

for (const [name, hash, code] of [
  ['Manila', '#/region/1300000000/municity/1380600000', '1380600000'],
  ['Iloilo City', '#/region/600000000/province/603000000/municity/631000000', '631000000'],
  ['Baguio City', '#/region/1400000000/province/1401100000/municity/1430300000', '1430300000'],
  ['Tacloban City', '#/region/800000000/province/803700000/municity/831600000', '831600000'],
  ['Calaca', '#/region/400000000/province/401000000/municity/401007000', '401007000'],
] as const) {
  test(`${name} stays at city level`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => { if (request.url().includes('bgysubmuns')) requests.push(request.url()); });
    await page.goto('/' + hash);
    await expect(page.locator('svg')).toHaveAttribute('data-view', hash);
    await expect(page.locator('path[data-psgc]')).toHaveCount(1);
    await expect(page.locator(`path[data-psgc="${code}"]`)).toBeVisible();
    if (name === 'Calaca') await expect(page.locator('#status')).toContainText('Barangay boundaries unavailable');
    expect(requests).toEqual([]);
  });
}
