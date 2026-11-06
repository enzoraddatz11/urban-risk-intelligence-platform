import { expect, test } from '@playwright/test';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.request().url().startsWith(apiUrl + '/') ? route.continue() : route.abort('blockedbyclient'));
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
});

test('listagens mostram nomes reais, IDs secundários e unidades de sensores', async ({ page, request }) => {
  let moduleLookups = 0;
  page.on('request', request => { if (request.url().includes('/api/modules?page=0&size=100')) moduleLookups++; });
  await page.getByRole('button', { name: /^Sensores: / }).click();
  const first = page.getByTestId('resource-card').filter({ visible: true }).first();
  const reference = first.getByTestId('related-reference');
  const sensors = await (await request.get(apiUrl + '/sensors?page=0&size=20')).json();
  const module = await (await request.get(apiUrl + '/modules/' + sensors.content[0].moduleId)).json();
  await expect(reference.getByText(module.name, { exact: true })).toBeVisible();
  await expect(reference.getByText('#' + module.id, { exact: true })).toBeVisible();
  expect(moduleLookups).toBe(1);
  await page.getByRole('tab', { name: 'Leituras', exact: true }).click();
  const readings = await (await request.get(apiUrl + '/readings?page=0&size=20')).json();
  const sensor = await (await request.get(apiUrl + '/sensors/' + readings.content[0].sensorId)).json();
  await expect(first.getByText(sensor.name, { exact: true }).first()).toBeVisible();
  await expect(first.getByText(sensor.unit, { exact: true })).toBeVisible();
  await page.getByRole('tab').filter({ hasText: 'Estrutura' }).click();
  await page.getByRole('tab', { name: 'Sistemas', exact: true }).click();
  const systems = await (await request.get(apiUrl + '/systems?page=0&size=20')).json();
  const systemModule = await (await request.get(apiUrl + '/modules/' + systems.content[0].moduleId)).json();
  await expect(reference.getByText(systemModule.name, { exact: true })).toBeVisible();
  await page.getByRole('tab').filter({ hasText: 'Operações' }).click();
  const events = await (await request.get(apiUrl + '/events?page=0&size=20')).json();
  const eventSystem = await (await request.get(apiUrl + '/systems/' + events.content[0].systemId)).json();
  await expect(reference.getByText(eventSystem.name, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Alertas', exact: true }).click();
  const alerts = await (await request.get(apiUrl + '/alerts?page=0&size=20')).json();
  const alertSystem = await (await request.get(apiUrl + '/systems/' + alerts.content[0].systemId)).json();
  await expect(reference.getByText(alertSystem.name, { exact: true })).toBeVisible();
  await expect(page.getByText(/^Registro #/)).toHaveCount(0);
});

test('falha na consulta de nomes mantém os IDs e permite recuperação', async ({ page, request }) => {
  await page.route('**/api/modules?*', route => route.abort('failed'));
  await page.getByRole('button', { name: /^Sensores: / }).click();
  const sensors = await (await request.get(apiUrl + '/sensors?page=0&size=20')).json();
  const module = await (await request.get(apiUrl + '/modules/' + sensors.content[0].moduleId)).json();
  await expect(page.getByText('Não foi possível consultar os nomes relacionados.', { exact: false })).toBeVisible();
  await expect(page.getByTestId('resource-card').filter({ visible: true }).first().getByText('Módulo #' + module.id, { exact: true })).toBeVisible();
  await page.unroute('**/api/modules?*');
  await page.getByRole('button', { name: 'Atualizar referências', exact: true }).click();
  await expect(page.getByTestId('resource-card').filter({ visible: true }).first().getByTestId('related-reference').getByText(module.name, { exact: true })).toBeVisible();
});
