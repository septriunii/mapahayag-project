import { expect, test } from '@playwright/test';
import { selectSvgLabel } from './svgInput';

for (const [region, province, municipality, name] of [
  ['200000000', '201500000', '201522000', 'Sanchez Mira'],
  ['1700000000', '1705300000', '1705323000', 'Dr. Jose P. Rizal'],
  ['1000000000', '1004200000', '1004217000', 'Don Victoriano'],
  ['1100000000', '1102300000', '1102324000', 'Sawata'],
] as const) {
  test(`current label and profile: ${name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/#/region/${region}/province/${province}`);
    await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
    const label = page.locator(`[data-label-psgc="${municipality}"]`);
    await expect(label).toHaveAttribute('data-label-name', name);
    await expect(page.locator(`path[data-psgc="${municipality}"]`)).toHaveAttribute('aria-label', name);
    await selectSvgLabel(page, `[data-label-psgc="${municipality}"]`);
    await expect(page.locator('svg')).toHaveAttribute('data-view', `#/region/${region}/province/${province}/municity/${municipality}`);
    await expect(page.locator('#detail-lgu-name')).toHaveText(name);
    await expect(page.locator('[data-profile-key]')).toContainText(name);
    expect(errors).toEqual([]);
  });
}

for (const alignment of ['nir', 'legacy']) {
  test(`${alignment}: official NIR identity and old bookmark retain correct Back and history`, async ({ page }, info) => {
    const region = alignment === 'nir' ? '1800000000' : '600000000';
    const canonical = `#/region/${region}/province/604500000/municity/630200000`;
    await page.goto(`/?alignment=${alignment}#/region/1800000000/province/1804500000/municity/1830200000`);
    await expect(page.locator('svg')).toHaveAttribute('data-view', canonical);
    await expect(page).toHaveURL(new RegExp(canonical + '$'));
    await expect(page.locator('#detail-lgu-name')).toContainText('Bacolod');
    await page.reload();
    await expect(page.locator('svg')).toHaveAttribute('data-view', canonical);
    await page.locator('#back-btn').click();
    await expect(page.locator('svg')).toHaveAttribute('data-view', `#/region/${region}/province/604500000`);
    await page.locator('#back-btn').click();
    await expect(page.locator('svg')).toHaveAttribute('data-view', `#/region/${region}`);
    await page.goBack();
    await expect(page.locator('svg')).toHaveAttribute('data-view', `#/region/${region}/province/604500000`);
    await page.goto(`/?alignment=${alignment}#/region/600000000/province/604500000/municity/630200000`);
    await expect(page.locator('svg')).toHaveAttribute('data-view', canonical);
    await expect(page.locator('svg')).toHaveAttribute('aria-busy', 'false');
    await page.screenshot({ path: info.outputPath('nir-code-review.png') });
  });
}
