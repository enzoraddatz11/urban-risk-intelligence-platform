import { expect, test } from '@playwright/test';
import { bottomTab, guardApi, openApp, visible } from './helpers';

test.beforeEach(async ({ page }) => { await guardApi(page); });

const offline = (route: import('@playwright/test').Route) => route.abort('internetdisconnected');

test('sem servidor: aviso não bloqueante e reconexão automática, sem clicar', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.route('**/api/**', offline);
  await openApp(page);
  const banner = visible(page, 'connection-offline');
  await expect(banner).toContainText('Sem conexão com o servidor');
  await expect(banner).toContainText('Você pode continuar usando o app');
  await page.screenshot({ path: testInfo.outputPath('desconectado.png'), fullPage: true });

  // A interface continua respondendo enquanto o app tenta reconectar.
  await bottomTab(page, /^Alertas/).click();
  await expect(page.getByText('ALERTAS PRIORIZADOS', { exact: true })).toBeVisible();
  await bottomTab(page, /^Painel/).click();
  await expect(page.getByTestId('project-introduction').getByText('EQUIPE DO PROJETO', { exact: true })).toBeVisible();

  // O servidor volta: o app se reconecta sozinho e carrega os dados.
  await page.unroute('**/api/**', offline);
  await expect(visible(page, 'connection-recovered')).toBeVisible({ timeout: 40000 });
  await expect(page.getByTestId('connection-offline')).toHaveCount(0);
  await expect(visible(page, 'city-status')).toBeVisible();
});

test('queda durante o uso mantém os últimos dados e permite reconectar na hora', async ({ page }) => {
  await openApp(page);
  await expect(visible(page, 'city-status')).toBeVisible();
  await page.route('**/api/**', offline);
  await page.getByRole('button', { name: 'Atualizar dados', exact: true }).click();
  await expect(visible(page, 'connection-offline')).toBeVisible();
  await expect(visible(page, 'city-status')).toContainText('dados anteriores');
  await page.unroute('**/api/**', offline);
  await page.getByRole('button', { name: 'Tentar reconectar agora', exact: true }).click();
  await expect(visible(page, 'connection-recovered')).toBeVisible();
  await expect(visible(page, 'city-status')).not.toContainText('dados anteriores');
});
