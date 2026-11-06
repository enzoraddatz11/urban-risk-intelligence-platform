import { expect, test } from '@playwright/test';

// Em testes isolados, nem uma configuração/cache incorreta pode enviar dados
// ao backend de desenvolvimento. Rotas fora da base configurada são bloqueadas.
test.beforeEach(async ({ page }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return;
  const allowedBase = apiUrl.replace(/\/+$/, '') + '/';
  await page.route('**/api/**', route => route.request().url().startsWith(allowedBase)
    ? route.continue() : route.abort('blockedbyclient'));
});

test('dashboard real, sete telas, formulários e cadastro de módulo', async ({ page }, testInfo) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (/Invalid DOM property|non-boolean attribute/.test(message.text())) runtimeErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
  await expect(page.getByText('Visão da missão', { exact: true })).toBeVisible();
  await expect(page.getByText('Última consulta:', { exact: false })).toBeVisible();
  const missionHeading = page.getByText('SITUAÇÃO DA MISSÃO', { exact: true });
  await missionHeading.scrollIntoViewIfNeeded();
  await expect(missionHeading).toBeInViewport();
  await expect(page.getByRole('button', { name: /^Sensores: / })).toBeVisible();
  const tabLabel = await page.getByText('Visão geral', { exact: true }).boundingBox();
  expect(tabLabel).not.toBeNull();
  expect(tabLabel!.height).toBeGreaterThanOrEqual(12);
  expect(tabLabel!.y + tabLabel!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });

  await page.getByRole('button', { name: /^Sensores: / }).click();
  await expect(page.getByText('Instrumentos conectados à missão', { exact: true })).toBeVisible();
  await page.getByText('Novo sensor', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tipo', exact: true })).toBeVisible();
  await page.getByText('Cancelar', { exact: true }).click();

  await page.getByRole('tab').filter({ hasText: 'Leituras' }).click();
  await page.getByText('Nova leitura', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Valor da medição', exact: true })).toBeVisible();
  await page.getByText('Cancelar', { exact: true }).click();
  await expect(page.getByText('Histórico de medições recebidas', { exact: true })).toBeVisible();

  await page.getByText('Visão geral', { exact: true }).click();
  await page.getByRole('button', { name: /^Sensores: / }).click();
  await expect(page.getByText('Instrumentos conectados à missão', { exact: true })).toBeVisible();

  await page.getByText('Estrutura', { exact: true }).click();
  await page.getByText('Novo módulo', { exact: true }).click();
  await page.getByText('Salvar registro', { exact: true }).click();
  await expect(page.getByText('Revise os campos destacados antes de enviar.', { exact: true })).toBeVisible();
  const name = 'Módulo UI ' + testInfo.project.name + ' ' + Date.now();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Descrição', exact: true }).fill('Cadastro real pelo formulário Expo Web');
  await page.route('**/api/modules', route => route.request().method() === 'POST' ? route.abort('failed') : route.continue());
  await page.getByText('Salvar registro', { exact: true }).click();
  await expect(page.getByText('Não foi possível confirmar o cadastro.', { exact: false })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue(name);
  await page.unroute('**/api/modules');
  await page.getByText('Salvar registro', { exact: true }).click();
  await expect(page.getByText('Cadastro confirmado', { exact: true })).toBeVisible();
  await page.getByText('Voltar à lista', { exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar registros', exact: true }).fill('zzzz-sem-correspondencia-529');
  await expect(page.getByText('Nenhum resultado encontrado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole('tab').filter({ hasText: 'Sistemas' }).click();
  await page.getByText('Novo sistema', { exact: true }).click();
  await expect(page.getByRole('button', { name: /^Módulo computacional:/ })).toBeVisible();
  await page.getByText('Cancelar', { exact: true }).click();

  await page.getByText('Operações', { exact: true }).click();
  await page.getByText('Novo evento', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Data e hora do ocorrido', exact: true })).toBeVisible();
  await page.getByText('Cancelar', { exact: true }).click();
  await page.getByRole('tab').filter({ hasText: 'Alertas' }).click();
  await page.getByText('Novo alerta', { exact: true }).click();
  await expect(page.getByRole('button', { name: /^Situação do alerta:/ })).toBeVisible();
  await page.getByText('Cancelar', { exact: true }).click();
  await expect(page.getByText('Ocorrências críticas da missão', { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});


test('falha de consulta e recuperação com resposta real', async ({ page }) => {
  await page.route('**/api/mission/status', route => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
  await expect(page.getByText('Não foi possível acessar a API.', { exact: false })).toBeVisible();
  await expect(page.getByText('Nenhum registro por aqui', { exact: true })).toHaveCount(0);
  await page.unroute('**/api/mission/status');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText('Última consulta:', { exact: false })).toBeVisible();
});

test('seletor pesquisável e retorno sem resultados', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
  await expect(page.getByText('Última consulta:', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /^Sensores: / }).click();
  await page.getByRole('button', { name: 'Novo sensor', exact: true }).click();
  const selection = page.getByRole('button', { name: /^Módulo computacional:/ });
  await expect(selection).toBeEnabled();
  await selection.click();
  await page.getByRole('textbox', { name: 'Buscar opções', exact: true }).fill('zzzzz-nenhum-registro');
  await expect(page.getByText('Nenhuma opção encontrada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar seleção', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByText('Instrumentos conectados à missão', { exact: true })).toBeVisible();
});
