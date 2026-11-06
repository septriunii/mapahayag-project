import { expect, test } from '@playwright/test';

for (const alignment of ['nir', 'legacy']) {
  test(`${alignment}: national Sulu hit belongs to Region IX and drills through all parent levels`, async ({ page }, info) => {
    await page.goto(`/?alignment=${alignment}`);
    await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: 'Close details menu' }).click();
    const point = await page.locator('svg').evaluate(svg => {
      const box = svg.getBoundingClientRect();
      const scale = Math.min((box.width - 60) / (131.2 - 112.2), (box.height - 60) / (25.3 - 2.3));
      const x = box.x + (box.width - (131.2 - 112.2) * scale) / 2 + (121.13 - 112.2) * scale;
      const y = box.y + (box.height - (25.3 - 2.3) * scale) / 2 + (25.3 - 6.0) * scale;
      return { x, y, owner: document.elementFromPoint(x, y)?.getAttribute('data-psgc') };
    });
    expect(point.owner).toBe('900000000');
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/900000000');
    const sulu = page.locator('path[data-psgc="1906600000"]');
    await expect(sulu).toBeVisible();
    await sulu.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/900000000/province/1906600000');
    await page.getByRole('button', { name: 'Open details menu' }).click();
    await expect(page.locator('[data-profile-key="province:0906600000"]')).toBeVisible();
    await expect(page.locator('#detail-region')).toContainText('Region IX');
    await expect(page.locator('path[data-psgc]')).toHaveCount(19);
    await page.locator('path[data-psgc="1906602000"]').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('[data-profile-key="municity:0906602000"]')).toBeVisible();
    await expect(page.locator('path[data-psgc]')).toHaveCount(1);
    await expect(page.locator('#detail')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await page.waitForFunction(() => [...document.querySelectorAll('.map-feature, .map-label, .map-boundaries')].every(node => getComputedStyle(node).opacity === '1'));
    await expect(page.locator('#back-btn')).toHaveText('← Sulu');
    await page.screenshot({ path: info.outputPath('sulu-jolo.png') });
    await page.locator('#back-btn').click(); await page.locator('#back-btn').click();
    await expect(page.locator('svg')).toHaveAttribute('data-view', '#/region/900000000');
    await page.goto(`/?alignment=${alignment}#/region/1900000000`);
    await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
    await expect(sulu).toHaveCount(0);
  });
}

test('old BARMM bookmarks and official PSGCs redirect cleanly through reload and history', async ({ page }) => {
  const province = '#/region/900000000/province/1906600000';
  await page.goto('/#/region/1900000000/province/1906600000/municity/1906602000');
  await expect(page).toHaveURL(new RegExp(province + '/municity/1906602000$'));
  await expect(page.locator('[data-profile-key="municity:0906602000"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('#back-btn')).toHaveText('← Sulu');
  await page.locator('#back-btn').click();
  await expect(page.locator('#back-btn')).toContainText('Region IX');
  await page.goBack();
  await expect(page.locator('[data-profile-key="municity:0906602000"]')).toBeVisible();
  await page.goto('/#/region/0900000000/province/0906600000/municity/0906602000');
  await expect(page).toHaveURL(new RegExp(province + '/municity/1906602000$'));
});
