import { expect, test } from '@playwright/test';
import { bottomTab, guardApi, visible } from './helpers';

test.beforeEach(async ({ page }) => { await guardApi(page); });

test('apresentação de sete segundos, API em paralelo, navegação e recarga', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const realStatus = page.waitForResponse(response => response.url().includes('/api/status') && response.status() === 200);
  await page.goto('/');
  const splash = page.getByTestId('startup-splash');
  await expect(splash).toBeVisible();
  const started = Date.now();
  await expect(splash.getByRole('heading', { name: 'Urban Risk Intelligence Platform', exact: true })).toBeVisible();
  await expect(splash.getByText('CIDADE SIMULADA · NOVA RIBEIRA', { exact: true })).toBeVisible();
  await expect(splash.getByTestId('startup-message')).toHaveText('Carregando mapa da cidade...');
  const status = await (await realStatus).json();
  // A API respondeu enquanto a apresentação ainda cobria a home.
  await expect(splash).toBeVisible();
  await expect(splash.getByTestId('startup-message')).toHaveText('Conectando sensores urbanos...', { timeout: 3000 });
  await expect(splash.getByTestId('startup-message')).toHaveText('Analisando riscos por bairro...', { timeout: 3000 });
  await expect(splash.getByTestId('startup-message')).toHaveText('Plataforma pronta.', { timeout: 3000 });
  await expect.poll(() => splash.getByTestId('startup-percent').textContent(), { timeout: 2000, intervals: [50] }).toBe('100%');
  await expect(splash).toHaveCount(0, { timeout: 2000 });
  const elapsed = Date.now() - started;
  expect(elapsed).toBeGreaterThanOrEqual(6700);
  expect(elapsed).toBeLessThan(9500);
  await expect(page.getByRole('button', { name: `Bairros monitorados: ${status.regions}`, exact: true })).toBeVisible();
  await expect(page.getByText('PAINEL DE ACOMPANHAMENTO', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-after-startup.png'), fullPage: true });
  await bottomTab(page, /^Monitoramento/).click();
  await expect(page.getByRole('button', { name: 'Novo bairro', exact: true })).toBeVisible();
  await expect(splash).toHaveCount(0);
  await bottomTab(page, /^Painel/).click();
  await expect(page.getByText('PAINEL DE ACOMPANHAMENTO', { exact: true })).toBeVisible();
  await expect(splash).toHaveCount(0);
  await page.reload();
  await expect(splash).toBeVisible();
  await expect(splash).toHaveCount(0, { timeout: 12000 });
  expect(errors).toEqual([]);
});

test('movimento reduzido e servidor fora do ar não travam a home', async ({ page }, testInfo) => {
  const offline = (route: import('@playwright/test').Route) => route.abort('failed');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', offline);
  await page.goto('/');
  const splash = page.getByTestId('startup-splash');
  await expect(splash).toBeVisible();
  await expect(splash.getByTestId('startup-progress-fill')).toHaveCSS('transition-duration', '0s');
  await page.screenshot({ path: testInfo.outputPath('startup-reduced-motion.png') });
  await expect(splash).toHaveCount(0, { timeout: 12000 });
  await expect(visible(page, 'connection-offline')).toBeVisible();
  await expect(page.getByTestId('project-introduction').getByText('EQUIPE DO PROJETO', { exact: true })).toBeVisible();
  await page.unroute('**/api/**', offline);
  await page.getByRole('button', { name: 'Tentar reconectar agora', exact: true }).click();
  await expect(page.getByText('Última consulta:', { exact: false }).filter({ visible: true })).toBeVisible();
  await expect(splash).toHaveCount(0);
});
