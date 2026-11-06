import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return;
  const allowedBase = apiUrl.replace(/\/+$/, '') + '/';
  await page.route('**/api/**', route => route.request().url().startsWith(allowedBase)
    ? route.continue() : route.abort('blockedbyclient'));
});

test('apresentação de sete segundos, API paralela, navegação e recarga', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const realStatus = page.waitForResponse(response => response.url().includes('/api/mission/status') && response.status() === 200);
  await page.goto('/');
  const splash = page.getByTestId('startup-splash');
  await expect(splash).toBeVisible();
  const started = Date.now();
  await expect(splash.getByRole('heading', { name: 'Space Mission Control', exact: true })).toBeVisible();
  await expect(splash.getByText('MISSÃO AURORA-1', { exact: true })).toBeVisible();
  await expect(splash.getByTestId('startup-message')).toHaveText('Inicializando sistemas...');
  await expect(splash.getByText('Sequência visual de apresentação', { exact: false })).toHaveCount(0);
  await expect(splash.getByText('Os dados operacionais são consultados pela API.', { exact: false })).toHaveCount(0);
  const status = await (await realStatus).json();
  await expect(splash).toBeVisible();
  // A API respondeu enquanto a apresentação ainda cobria a home.
  await expect(splash.getByTestId('startup-message')).toHaveText('Conectando telemetria...', { timeout: 3000 });
  await expect(splash.getByTestId('startup-message')).toHaveText('Verificando módulos da missão...', { timeout: 3000 });
  await expect(splash.getByTestId('startup-message')).toHaveText('Missão pronta.', { timeout: 3000 });
  await expect.poll(() => splash.getByTestId('startup-percent').textContent(), { timeout: 2000, intervals: [50] }).toBe('100%');
  await expect(splash).toHaveCount(0, { timeout: 2000 });
  const elapsed = Date.now() - started;
  expect(elapsed).toBeGreaterThanOrEqual(6700);
  expect(elapsed).toBeLessThan(9500);
  await expect(page.getByRole('button', { name: `Sensores: ${status.sensors}`, exact: true })).toBeVisible();
  await expect(page.getByText('CENTRAL DE MONITORAMENTO', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-after-startup.png'), fullPage: true });
  await page.getByRole('tab').filter({ hasText: 'Estrutura' }).click();
  await expect(page.getByRole('button', { name: 'Novo módulo', exact: true })).toBeVisible();
  await expect(splash).toHaveCount(0);
  await page.getByRole('tab').filter({ hasText: 'Visão geral' }).click();
  await expect(page.getByText('CENTRAL DE MONITORAMENTO', { exact: true })).toBeVisible();
  await expect(splash).toHaveCount(0);
  await page.reload();
  await expect(splash).toBeVisible();
  await expect(splash).toHaveCount(0, { timeout: 12000 });
  expect(errors).toEqual([]);
});

test('movimento reduzido e falha real de conexão preservam o estado de erro da home', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/mission/status', route => route.abort('failed'));
  await page.goto('/');
  const splash = page.getByTestId('startup-splash');
  await expect(splash).toBeVisible();
  await expect(splash.getByTestId('astronaut-float')).toHaveCSS('animation-name', 'none');
  await expect(splash.getByTestId('startup-progress-fill')).toHaveCSS('transition-duration', '0s');
  await page.screenshot({ path: testInfo.outputPath('startup-reduced-motion.png') });
  await expect(splash).toHaveCount(0, { timeout: 12000 });
  await expect(page.getByText('Não foi possível acessar a API.', { exact: false })).toBeVisible();
  await expect(page.getByTestId('project-introduction').getByText('EQUIPE DO PROJETO', { exact: true })).toBeVisible();
  await page.unroute('**/api/mission/status');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText('Última consulta:', { exact: false })).toBeVisible();
  await expect(splash).toHaveCount(0);
});
