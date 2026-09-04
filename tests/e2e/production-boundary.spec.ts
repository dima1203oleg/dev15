import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = ['/', '/app', '/partner', '/display', '/kiosk', '/desktop', '/mobile', '/tablet', '/tv'];

test.describe('SIREN UA production boundary', () => {
  test('health and readiness expose disconnected dependencies honestly', async ({ request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    expect(health.headers()['cache-control']).toContain('no-store');
    await expect(health.json()).resolves.toMatchObject({
      status: 'ok',
      threatDataMode: 'NOT_CONNECTED',
      financialDataMode: 'NOT_CONNECTED',
      payoutProvider: 'NOT_CONNECTED',
    });

    const readiness = await request.get('/api/ready');
    expect(readiness.status()).toBe(503);
    expect(readiness.headers()['cache-control']).toContain('no-store');
    await expect(readiness.json()).resolves.toMatchObject({
      status: 'not_ready',
      checks: {
        threatData: 'NOT_CONNECTED',
        financialData: 'NOT_CONNECTED',
        payoutProvider: 'NOT_CONNECTED',
      },
    });
  });

  test('safety and financial APIs fail closed when integrations are absent', async ({ request }) => {
    const safety = await request.get('/api/threats/status');
    expect(safety.status()).toBe(200);
    await expect(safety.json()).resolves.toMatchObject({ connected: false, mode: 'NOT_CONNECTED' });

    for (const endpoint of ['/api/partner/dashboard', '/api/partner/ledger', '/api/partner/payouts']) {
      const response = await request.get(endpoint);
      expect(response.status(), endpoint).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ error: 'FINANCIAL_DATA_NOT_CONNECTED' });
    }

    const cap = await request.post('/api/admin/validate-cap', {
      data: { l1RateBps: 2500, l2RateBps: 2500, campaignBonusBps: 0 },
    });
    expect(cap.status()).toBe(503);
    await expect(cap.json()).resolves.toMatchObject({ error: 'FINANCIAL_DATA_NOT_CONNECTED' });

    const unknownApi = await request.get('/api/does-not-exist');
    expect(unknownApi.status()).toBe(404);
    expect(unknownApi.headers()['content-type']).toContain('application/json');
    await expect(unknownApi.json()).resolves.toMatchObject({ error: 'API_NOT_FOUND' });
  });

  test('all public experience routes render without a document error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const route of publicRoutes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('body')).toContainText('SIREN');
      expect(pageErrors, route).toEqual([]);
    }
  });

  test('mobile safety flow remains useful without live data', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mobile', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('OFFLINE', { exact: true })).toBeVisible();
    await expect(page.getByText('Регіон не визначено', { exact: true })).toBeVisible();
    await expect(page.getByText('Актуальні дані недоступні', { exact: true })).toBeVisible();
    await expect(page.getByText('—', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: /^Деталі/ }).click();
    await expect(page.getByRole('dialog', { name: 'Деталі регіону' })).toBeVisible();
    await expect(page.getByText('Дані тимчасово недоступні', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Закрити деталі' }).click();
    await expect(page.getByRole('dialog', { name: 'Деталі регіону' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Хронологія', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Історія змін' })).toBeVisible();
    await expect(page.getByText('Актуальна timeline з’явиться після підключення джерела.')).toBeVisible();

    await page.getByRole('button', { name: 'Укриття' }).click();
    await expect(page.getByRole('heading', { name: 'Укриття поруч' })).toBeVisible();
    await expect(page.getByText('Дані про укриття тимчасово недоступні.')).toBeVisible();
  });

  test('desktop intelligence controls do not invent unavailable data', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/desktop', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('NOT CONNECTED · LIVE DATA UNAVAILABLE')).toBeVisible();
    await expect(page.getByText('Очікуємо джерело даних')).toBeVisible();
    await expect(page.getByText('Актуальні події тимчасово недоступні.')).toBeVisible();

    await page.getByRole('button', { name: 'Переглянути ситуацію' }).click();
    await expect(page.getByText('Spatial Command View')).toBeVisible();

    await page.getByRole('button', { name: 'Київський регіон' }).click();
    await expect(page.getByText('Focused Alert Mode')).toBeVisible();
    await expect(page.getByText('Київський регіон', { exact: true }).first()).toBeVisible();

    const fallback = page.getByRole('button', { name: /2D fallback|3D core/ });
    await fallback.click();
    await expect(fallback).toContainText('3D core');
    await expect(page.getByText('2D FALLBACK · spatial canvas вимкнено')).toBeVisible();
  });

  test('dedicated safety surfaces have no critical axe violations', async ({ page }) => {
    for (const route of ['/mobile', '/tablet', '/desktop', '/tv']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, route).toEqual([]);
    }
  });

  test('mobile disconnected safety surface matches its golden screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mobile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveScreenshot('mobile-not-connected.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('desktop disconnected safety surface matches its golden screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/desktop', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveScreenshot('desktop-not-connected.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('production safety surfaces expose critical content before idle rendering settles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mobile', { waitUntil: 'domcontentloaded' });
    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return navigation ? {
        domContentLoaded: (navigation as PerformanceNavigationTiming).domContentLoadedEventEnd,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime ?? null,
      } : null;
    });
    expect(timing).not.toBeNull();
    expect(timing?.domContentLoaded).toBeLessThan(5_000);
  });
});
