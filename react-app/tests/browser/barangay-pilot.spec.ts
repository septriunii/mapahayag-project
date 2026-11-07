import { expect, test } from '@playwright/test';
import { selectSvgLabel } from './svgInput';

for (const [name, province, city, count] of [
  ['Zamboanga City', '907300000', '931700000', 98],
  ['Titay', '908300000', '908315000', 30],
  ['Isabela City', '990100000', '990101000', 45],
] as const) {
  test(`${name} opens barangay boundaries and names from its existing view`, async ({ page }, info) => {
    if (city === '908315000') await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('bgysubmuns')) requests.push(request.url()); });
    const provinceRoute = `#/region/900000000/province/${province}`;
    const cityRoute = `${provinceRoute}/municity/${city}`;
    await page.goto('/' + provinceRoute);
    const close = page.getByRole('button', { name: 'Close details menu' });
    await close.click();
    await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
    expect(requests).toEqual([]);
    await selectSvgLabel(page, `[data-label-psgc="${city}"]`);
    await expect(page.locator('svg')).toHaveAttribute('data-view', cityRoute);
    await expect(page.locator('path[data-psgc]')).toHaveCount(count);
    await expect(page.locator('#status')).toHaveText(`${count} barangays`);
    await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('[data-label-name]').first()).toBeVisible();
    const shape = page.locator('path[data-psgc]').first();
    const barangay = await shape.getAttribute('aria-label');
    await shape.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#status')).toHaveText(barangay!);
    await expect(shape).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: info.outputPath('barangays.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Open details menu' }).click();
    await expect(page.locator('#detail-lgu-name')).toHaveText({
      '931700000': 'City of Zamboanga', '908315000': 'Titay', '990101000': 'City of Isabela',
    }[city]);
    await expect(page.getByRole('button', { name: 'View barangays' })).toHaveCount(0);
    await close.click();
    await expect(page.locator('#detail')).toHaveCSS('visibility', 'hidden');
    await page.locator('#back-btn').click();
    await expect(page.locator('svg')).toHaveAttribute('data-view', provinceRoute);
    await page.goBack();
    await expect(page.locator('path[data-psgc]')).toHaveCount(count);
    expect(requests).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}
