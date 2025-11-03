// @ts-check
import { test, expect } from '@playwright/test';

async function resetCount(request) {
  await request.post('/_reset');
}
async function fetchCount(request) {
  const res = await request.get('/_count');
  const { deleteCount } = await res.json();
  return deleteCount;
}

test.describe('#1444 empty target regression', () => {
  test('Turbo 8.0.13: all target variants should trigger DELETE (expected correct behavior)', async ({ page, request }) => {
    await resetCount(request);
    await page.goto('/v8_0_13');
    // bare target
    await page.getByRole('link', { name: /bare/ }).click();
    await page.waitForTimeout(200);
    // target=""
    await page.getByRole('link', { name: /target=""$/ }).click();
    await page.waitForTimeout(200);
    // target="_self"
    await page.getByRole('link', { name: /_self/ }).click();
    await page.waitForTimeout(200);
    const count = await fetchCount(request);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Turbo 8.0.14: demonstrates regression (expected to fail until fixed)', async ({ page, request }) => {
    test.fixme(true, 'Known regression on 8.0.14: empty/bare target links are ignored by Turbo');
    await resetCount(request);
    await page.goto('/v8_0_14');
    await page.getByRole('link', { name: /bare/ }).click();
    await page.waitForTimeout(200);
    await page.getByRole('link', { name: /target=""$/ }).click();
    await page.waitForTimeout(200);
    await page.getByRole('link', { name: /_self/ }).click();
    await page.waitForTimeout(200);
    const count = await fetchCount(request);
    // When the bug is fixed, this should also be >= 3
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
