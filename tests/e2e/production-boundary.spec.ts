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

    for (const endpoint of ['/api/threats/live', '/api/threats/regions', '/api/threats/shelters', '/api/partner/dashboard', '/api/partner/ledger', '/api/partner/payouts']) {
      const response = await request.get(endpoint);
      expect(response.status(), endpoint).toBe(503);
      const body = await response.json();
      expect(body.error, endpoint).toMatch(/NOT_CONNECTED/);
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

    const referral = await request.get('/r/SIREN_ATLAS', { maxRedirects: 0 });
    expect(referral.status()).toBe(503);
    await expect(referral.json()).resolves.toMatchObject({ error: 'REFERRAL_ATTRIBUTION_NOT_CONNECTED', status: 'NOT_CONNECTED' });

    const referralLink = await request.get('/api/partner/referral-link');
    expect(referralLink.status()).toBe(503);
    await expect(referralLink.json()).resolves.toMatchObject({ error: 'FINANCIAL_DATA_NOT_CONNECTED' });
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

  test('partner and admin dialogs expose unavailable financial capabilities clearly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('#open-partner-cabinet-btn').click();
    await expect(page.getByText('Фінансові дані недоступні', { exact: true })).toBeVisible();
    await expect(page.getByText('STATUS: NOT_CONNECTED', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Закрити' }).click();

    await page.locator('#open-admin-btn').click();
    await page.getByRole('button', { name: '50% Hard Cap Валідатор' }).click();
    await expect(page.getByText('CAP VALIDATOR · NOT CONNECTED', { exact: true })).toBeVisible();
    await expect(page.getByText('undefined / 50%', { exact: true })).toHaveCount(0);
  });

  test('dedicated safety surfaces have no critical axe violations', async ({ page }) => {
    for (const route of ['/', '/app', '/partner', '/display', '/kiosk', '/mobile', '/tablet', '/desktop', '/tv']) {
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

  test('clears previously rendered threat data when a later critical feed fails', async ({ page }) => {
    await page.route('**/api/threats/live', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE' }),
      });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('NOT CONNECTED', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('DEMO DATA', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/ПІДКЛЮЧЕННЯ ОЧІКУЄТЬСЯ/)).toBeVisible();
  });

  test('rejects malformed connected threat payloads instead of rendering partial data', async ({ page }) => {
    await page.route('**/api/threats/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true, mode: 'LIVE', lastSyncAt: '2026-09-05T10:00:00.000Z' }),
      });
    });
    await page.route('**/api/threats/live', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ threats: [{ id: 'bad-event', currentLat: 'not-a-number' }] }),
      });
    });
    await page.route('**/api/threats/regions', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ regions: [] }) });
    });
    await page.route('**/api/threats/shelters', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ shelters: [] }) });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('NOT CONNECTED', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('bad-event', { exact: true })).toHaveCount(0);
  });

  test('partner cabinet renders both referral levels and generates local sharing assets', async ({ page }) => {
    await page.route('**/api/partner/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          partner: {
            id: 'partner-test', userId: 'user-test', referralCode: 'TEST123', rank: 'GOLD', effectiveRank: 'GOLD',
            partnerRateBps: 2000, rankState: 'ACTIVE',
            graceInfo: { isActive: false, daysRemaining: 0, cycleCount: 0, preservedRank: 'GOLD', preservedRateBps: 2000 },
            qualityScore: 96, qualityStatus: 'QUALITY_GOOD', ambassadorTier: 'NONE', isAmbassadorApproved: false,
            activeL1PaidCount: 75, activeL2PaidCount: 12, totalL1Count: 80, totalL2Count: 15,
            totalClicks: 100, totalInstalls: 50, createdAt: '2026-09-01T00:00:00.000Z'
          },
          wallet: { partnerId: 'partner-test', pendingMinor: 0, heldMinor: 0, availableMinor: 25000, lockedPayoutMinor: 0, paidTotalMinor: 0, lifetimeEarnedMinor: 25000, currency: 'UAH' },
          rankProgress: { currentPaidL1: 75, nextRank: 'PLATINUM', targetThreshold: 200, remainingToNext: 125, percentageToNext: 38 },
          payoutEligibility: { minimumPayoutMinor: null, minimumPayout: { baseCurrency: 'USD', baseAmount: '10.00', payoutCurrency: 'UAH', amountMinor: null, status: 'FX_SOURCE_NOT_CONNECTED' }, feesPaidBy: 'PARTNER', providerStatus: 'NOT_CONNECTED' }
        })
      });
    });
    await page.route('**/api/partner/network', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          l1: { count: 1, activePaidCount: 1, offset: 0, limit: 20, hasMore: false, items: [{ id: 'l1-test', userId: 'u1', userAnonymousLabel: 'Користувач #L1-TEST', referrerL1Id: 'partner-test', sourceChannel: 'TELEGRAM', utmCampaign: 'test', isQualifiedPaid: true, subscriptionPlan: 'PREMIUM_MONTHLY', monthlyQcbMinor: 100, registeredAt: '2026-09-01T00:00:00.000Z', lastPaymentAt: '2026-09-01T00:00:00.000Z', status: 'ACTIVE' }] },
          l2: { count: 1, activePaidCount: 1, offset: 0, limit: 20, hasMore: false, items: [{ id: 'l2-test', userId: 'u2', userAnonymousLabel: 'Користувач #L2-TEST', referrerL1Id: 'partner-child', referrerL2Id: 'partner-test', sourceChannel: 'QR', utmCampaign: 'test', isQualifiedPaid: true, subscriptionPlan: 'PREMIUM_MONTHLY', monthlyQcbMinor: 100, registeredAt: '2026-09-01T00:00:00.000Z', lastPaymentAt: '2026-09-01T00:00:00.000Z', status: 'ACTIVE' }] }
        })
      });
    });
    await page.route('**/api/partner/ledger', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ wallet: {}, entries: [], totalEntriesCount: 0, integrityCheck: 'ZERO_SUM_VERIFIED' }) });
    });
    await page.route('**/api/partner/payouts', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ payouts: [] }) });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#open-partner-cabinet-btn').click();
    await expect(page.getByText('Кабінет партнера SIREN UA')).toBeVisible();

    await page.getByRole('button', { name: /Мережа L1 \/ L2/ }).click();
    await expect(page.getByRole('heading', { name: 'L1 · Особисті запрошення' })).toBeVisible();
    await expect(page.getByText('Користувач #L1-TEST')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'L2 · Мережа першого рівня' })).toBeVisible();
    await expect(page.getByText('Користувач #L2-TEST')).toBeVisible();

    await page.getByRole('button', { name: 'Огляд & Фінанси' }).click();
    await page.getByRole('button', { name: 'Створити QR-код' }).click();
    await expect(page.getByRole('img', { name: 'QR-код персонального referral-посилання' })).toBeVisible();

    await page.getByRole('button', { name: 'Інструменти поширення' }).click();
    await page.getByRole('button', { name: 'Згенерувати UTM' }).click();
    await expect(page.getByText(/utm_source=partner/)).toBeVisible();
  });

  test('mobile partner invite does not use an untracked placeholder link', async ({ page }) => {
    await page.route('**/api/partner/referral-link', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'FINANCIAL_DATA_NOT_CONNECTED', message: 'Партнерський backend не підключений.' }) });
    });
    await page.goto('/mobile', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Партнер' }).click();
    await page.getByRole('button', { name: 'Запросити' }).click();
    await expect(page.getByRole('status')).toContainText('Партнерські дані недоступні');
    await expect(page.getByText('/join/sirenua', { exact: true })).toHaveCount(0);
  });
});
