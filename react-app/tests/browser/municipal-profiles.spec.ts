import { expect, test } from '@playwright/test';
import index from '../../../psgc-index.json' with { type: 'json' };
import facts from '../../src/data/municipal-facts.json' with { type: 'json' };

// One real municipality per mapped province, plus NCR and special city paths.
const samples = index.municities.filter((row, position, rows) =>
  row.type === 'Mun' && rows.findIndex(other => other.province_psgc === row.province_psgc && other.type === 'Mun') === position
);
for (const code of [630200000, 990101000, 1380600000, 1381701000, 1908703000, 1102324000]) {
  const row = index.municities.find(row => row.psgc === code);
  if (row && !samples.some(sample => sample.psgc === row.psgc)) samples.push(row);
}

for (const sample of samples) {
  test(`${sample.name} (${sample.psgc}): profile follows the real drilldown hierarchy`, async ({ page }) => {
    const region = sample.province_psgc === 1906600000 ? 900000000 : sample.region_psgc;
    const hash = region === 1300000000
      ? `#/region/${sample.region_psgc}/municity/${sample.psgc}`
      : `#/region/${region}/province/${sample.province_psgc}/municity/${sample.psgc}`;
    const fact = facts.records.find(row => Number(row.mapPsgc) === sample.psgc)!;
    await page.goto('/' + hash);
    await expect(page.locator('svg')).toHaveAttribute('data-view', hash);
    const article = page.locator(`[data-profile-key="municity:${fact.psgc}"]`);
    await expect(article).toBeVisible();
    await expect(page.locator('[data-profile-key]')).toHaveCount(1);
    await expect(article.locator('[data-metric="population"]')).toContainText(fact.population.toLocaleString('en-PH'));
    await expect(article.locator('[data-metric="population"] time')).toHaveAttribute('datetime', '2024-07-01');
    await expect(article.getByRole('region', { name: 'Economy and Culture' })).toContainText('Not yet verified');
    await expect(article.locator('[data-metric="barangays"]')).toContainText('Data unavailable');
    await page.reload();
    await expect(article).toBeVisible();
    await page.locator('#back-btn').click();
    await expect(article).toHaveCount(0);
    await page.goBack();
    await expect(article).toBeVisible();
  });
}

test('municipal facts load on demand, cache across visits and preserve configured records', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (/municipalData-.*\.js/.test(request.url())) requests.push(request.url()); });
  await page.route('**/data.json', route => route.fulfill({ json: { detailFields: [{ key: 'note', label: 'Custom record' }], data: { municity: [{ psgc: 907203000, note: '<img src=x onerror=alert(1)>' }] } } }));
  await page.goto('/');
  await expect(page.locator('[data-profile-key="national"]')).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.goto('/#/region/900000000/province/907200000/municity/907203000');
  await expect(page.locator('[data-profile-key="municity:0907203000"]')).toBeVisible();
  await expect(page.locator('#detail-body')).toContainText('<img src=x');
  await expect(page.locator('#detail img')).toHaveCount(0);
  await page.locator('#back-btn').click();
  await page.locator('path[data-psgc="907204000"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-profile-key="municity:0907204000"]')).toContainText('7,874');
  expect(requests).toHaveLength(1);
});

test('failed municipal catalog preserves the working map and existing detail fallback', async ({ page }) => {
  await page.route('**/assets/municipalData-*.js', route => route.abort());
  await page.goto('/#/region/900000000/province/907200000/municity/907203000');
  await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#detail-body')).toContainText('Geographic profile unavailable');
  await expect(page.locator('[data-profile-key]')).toHaveCount(0);
  await page.locator('#back-btn').click();
  await expect(page.locator('[data-profile-key="province:0907200000"]')).toBeVisible();
});
