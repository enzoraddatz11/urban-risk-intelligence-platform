import { expect, test } from '@playwright/test';
import { bottomTab, guardApi, openApp, visible } from './helpers';

test.beforeEach(async ({ page }) => { await guardApi(page); });

test('painel, notificação, alertas priorizados com origem e confiança e navegação', async ({ page }, testInfo) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (/Invalid DOM property|non-boolean attribute/.test(message.text())) runtimeErrors.push(message.text()); });
  await openApp(page);

  await expect(page.getByText('Painel da cidade', { exact: true })).toBeVisible();
  const city = visible(page, 'city-status');
  await expect(city.getByText('SITUAÇÃO DA CIDADE', { exact: true })).toBeVisible();
  await expect(city.getByText('Crítico', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Bairros monitorados: \d+$/ })).toBeVisible();
  await expect(page.getByTestId('dashboard-screen').getByTestId('top-alerts').getByTestId('alert-card')).toHaveCount(3);

  // Notificação no app para os alertas de prioridade alta e crítica.
  const notification = visible(page, 'alert-notification');
  await expect(notification).toContainText('novos alertas prioritários');
  await page.screenshot({ path: testInfo.outputPath('painel.png'), fullPage: true });
  await notification.getByRole('button', { name: 'Ver alertas', exact: true }).click();
  await expect(page.getByTestId('alert-notification')).toHaveCount(0);

  await expect(page.getByText('ALERTAS PRIORIZADOS', { exact: true })).toBeVisible();
  const cards = page.getByTestId('alerts-screen').getByTestId('alert-card');
  await expect(cards).toHaveCount(5);
  const first = cards.first();
  await expect(first.getByText('Ribeirão Claro acima da cota de alerta', { exact: true })).toBeVisible();
  await expect(first.getByTestId('source-badge').getByText('Sensor', { exact: true })).toBeVisible();
  await expect(first.getByText('Confiança alta · 90/100', { exact: true })).toBeVisible();
  await expect(first.getByText('Prioridade: Crítica', { exact: true })).toBeVisible();
  await expect(first.getByText('Por que esta prioridade?', { exact: true })).toBeVisible();
  await expect(cards.last().getByText('Comunitário', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('alertas.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Falta de água', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('tab', { name: 'Todos', exact: true }).click();
  await expect(cards).toHaveCount(5);

  await bottomTab(page, /^Ocorrências/).click();
  await expect(page.getByText('Riscos identificados na cidade', { exact: true })).toBeVisible();
  await expect(page.getByTestId('resource-screen-events').getByTestId('resource-card').first().getByTestId('source-badge')).toBeVisible();
  await page.getByRole('tab', { name: 'Relatos', exact: true }).click();
  await expect(page.getByText('Relatos são anônimos', { exact: false })).toBeVisible();

  await bottomTab(page, /^Monitoramento/).click();
  await expect(page.getByTestId('resource-screen-regions').getByTestId('resource-card').getByText('Várzea do Ribeirão', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Sensores', exact: true }).click();
  const sensor = page.getByTestId('resource-screen-sensors').getByTestId('resource-card').filter({ hasText: 'Pluviômetro da Várzea' });
  await expect(sensor.getByTestId('related-reference').getByText('Várzea do Ribeirão', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Leituras', exact: true }).click();
  await expect(page.getByText('Medições recebidas dos sensores', { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('relato anônimo: dados pessoais são bloqueados antes do envio e relato válido é salvo', async ({ page }) => {
  const reportPosts: string[] = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/reports')) reportPosts.push(request.postData() ?? ''); });
  await openApp(page);
  await page.getByRole('button', { name: 'Enviar relato anônimo', exact: true }).click();
  await expect(page.getByTestId('privacy-notice')).toBeVisible();
  const region = page.getByRole('button', { name: /^Bairro \/ região:/ });
  await expect(region).toBeEnabled();
  await region.click();
  await page.getByText(/^Várzea do Ribeirão · #\d+$/).click();
  const text = page.getByRole('textbox', { name: 'Relato', exact: true });
  await text.fill('Rua alagada, me liguem no (11) 98765-4321');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Remova dados pessoais do relato', { exact: false })).toBeVisible();
  expect(reportPosts).toEqual([]);
  await text.fill('Água na altura da canela perto da escola.');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Cadastro confirmado', { exact: true })).toBeVisible();
  await expect(page.getByText('Relato anônimo de alagamento', { exact: true })).toBeVisible();
  expect(reportPosts).toHaveLength(1);
  expect(Object.keys(JSON.parse(reportPosts[0])).sort()).toEqual(['description', 'occurredAt', 'regionId', 'riskType']);
});

test('formulário de evento exige origem e confiança entre 0 e 100', async ({ page }) => {
  await openApp(page);
  await bottomTab(page, /^Ocorrências/).click();
  await page.getByRole('button', { name: 'Novo evento', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Origem do dado:/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Confiança (0 a 100)', exact: true }).fill('150');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Use um valor entre 0 e 100.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByText('Riscos identificados na cidade', { exact: true })).toBeVisible();
});
