import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return;
  const allowedBase = apiUrl.replace(/\/+$/, '') + '/';
  await page.route('**/api/**', route => route.request().url().startsWith(allowedBase)
    ? route.continue() : route.abort('blockedbyclient'));
});

test('apresentação responsiva e integrantes disponíveis mesmo sem API', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/Invalid DOM property|non-boolean attribute/.test(message.text())) errors.push(message.text());
  });
  await page.route('**/api/mission/status', route => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
  const intro = page.getByTestId('project-introduction');
  await expect(intro.getByRole('heading', { name: 'Space Mission Control', exact: true })).toBeVisible();
  await expect(intro.getByText('Sistema integrado para monitoramento', { exact: false })).toBeVisible();
  const cards = intro.getByTestId('team-member-card');
  await expect(cards).toHaveCount(3);
  for (const [index, [name, rm]] of [
    ['Enzo Raddatz', '556312'],
    ['Eric Perez Martinez Melillo Siciliano', '558651'],
    ['Lucas Costa Sanson', '556042'],
  ].entries()) {
    await expect(cards.nth(index).getByText(name, { exact: true })).toBeVisible();
    await expect(cards.nth(index).getByText('RM: ' + rm, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Não foi possível acessar a API.', { exact: false })).toBeVisible();
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(async () => {
      const bounds = await intro.evaluate(element => {
        const card = element.getBoundingClientRect();
        return {
          left: card.left, right: card.right,
          childrenFit: Array.from(element.querySelectorAll('[dir], svg')).every(child => {
            const rect = child.getBoundingClientRect();
            return rect.left >= card.left - 1 && rect.right <= card.right + 1;
          }),
        };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.childrenFit).toBe(true);
    }).toPass();
    const eric = cards.nth(1);
    const name = eric.getByText('Eric Perez Martinez Melillo Siciliano', { exact: true });
    const nameBox = (await name.boundingBox())!;
    const rmBox = (await eric.getByText('RM: 558651', { exact: true }).boundingBox())!;
    const numberBox = (await eric.getByText('02', { exact: true }).boundingBox())!;
    expect(rmBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height);
    expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(numberBox.x);
    expect(await name.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    if (width < 900) {
      const description = await intro.getByText('Sistema integrado para monitoramento', { exact: false }).boundingBox();
      const astronaut = await intro.getByTestId('presentation-astronaut').boundingBox();
      const team = await intro.getByTestId('project-team').boundingBox();
      expect(astronaut!.y).toBeGreaterThanOrEqual(description!.y + description!.height);
      expect(team!.y).toBeGreaterThanOrEqual(astronaut!.y + astronaut!.height);
      const card = await intro.boundingBox();
      expect(Math.abs(astronaut!.x + astronaut!.width / 2 - card!.x - card!.width / 2)).toBeLessThanOrEqual(1);
    }
    await intro.screenshot({ path: testInfo.outputPath('presentation-' + width + '.png') });
  }
  expect(errors).toEqual([]);
});

test('flutuação suave respeita mudanças na preferência de movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
  const astronaut = page.getByTestId('project-introduction').getByTestId('astronaut-float');
  await expect(astronaut).toHaveCSS('animation-duration', '4s');
  await expect(astronaut).toHaveCSS('animation-iteration-count', 'infinite');
  await expect(astronaut).toHaveCSS('animation-play-state', 'running');
  const initialTransform = await astronaut.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => astronaut.evaluate(element => getComputedStyle(element).transform)).not.toBe(initialTransform);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(astronaut).toHaveCSS('animation-name', 'none');
  await expect(astronaut).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(astronaut).not.toHaveCSS('animation-name', 'none');
});
