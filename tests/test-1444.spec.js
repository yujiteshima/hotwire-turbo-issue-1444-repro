// @ts-check
import { test, expect } from '@playwright/test';

const WAIT_MS = 400; // short wait time sufficient to detect any request sent

async function resetStats(request) {
  await request.post('http://localhost:3000/_reset');
}
async function fetchStats(request) {
  const res = await request.get('http://localhost:3000/_stats');
  return await res.json();
}
function diffStats(after, before) {
  return {
    delete: after.deleteCount - before.deleteCount,
    postOverride: after.postOverrideCount - before.postOverrideCount,
    get: after.getCount - before.getCount,
    total: after.totalLogoutHits - before.totalLogoutHits,
  };
}
async function clickAndMeasure(page, request, selector) {
  const before = await fetchStats(request);
  await page.locator(selector).first().click();
  await page.waitForTimeout(WAIT_MS);
  const after = await fetchStats(request);
  return diffStats(after, before);
}

test.describe('#1444 empty target regression — method-by-method assertions', () => {
  test('Turbo 8.0.13: bare/empty send DELETE(or override), _self sends GET', async ({ page, request }) => {
    await resetStats(request);
    await page.goto('/v8_0_13');

    // 1) bare target  -> <a href="/logout" data-turbo-method="DELETE" target>
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target]');
      // In 8.0.13, Turbo intercepts and expects exactly 1 request: DELETE or POST+_method=delete
      expect(d.total).toBe(1);
      expect(d.delete + d.postOverride).toBe(1);
      expect(d.get).toBe(0);
    }

    // 2) target=""    -> <a href="/logout" data-turbo-method="DELETE" target="">
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target=""]');
      expect(d.total).toBe(1);
      expect(d.delete + d.postOverride).toBe(1);
      expect(d.get).toBe(0);
    }

    // 3) target="_self" -> <a href="/logout" data-turbo-method="DELETE" target="_self">
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target="_self"]');
      // Known limitation in 8.0.13: Turbo does not intercept, browser sends 1 GET
      expect(d.total).toBe(1);
      expect(d.get).toBe(1);
      expect(d.delete + d.postOverride).toBe(0);
    }
  });

  test.fixme('Turbo 8.0.14: bare/empty do nothing (regression), _self still GET', async ({ page, request }) => {
    // Explicit verification of the known regression (#1444) on a per-link basis
    // Once the fix is merged, update expectations to match 8.0.13 behavior
    await resetStats(request);
    await page.goto('/v8_0_14');

    // 1) bare target  -> nothing is sent (regression)
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target]');
      expect(d.total).toBe(0);
      expect(d.delete + d.postOverride + d.get).toBe(0);
    }

    // 2) target=""    -> nothing is sent (regression)
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target=""]');
      expect(d.total).toBe(0);
      expect(d.delete + d.postOverride + d.get).toBe(0);
    }

    // 3) target="_self" -> GET is sent (limitation persists)
    {
      const d = await clickAndMeasure(page, request, 'a[href="/logout"][target="_self"]');
      expect(d.total).toBe(1);
      expect(d.get).toBe(1);
      expect(d.delete + d.postOverride).toBe(0);
    }
  });
});
