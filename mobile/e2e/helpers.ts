import { expect, type Page } from '@playwright/test';

/** Em testes isolados, bloqueia qualquer chamada a uma API diferente da configurada (protege o banco de desenvolvimento). */
export async function guardApi(page: Page) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return;
  const allowedBase = apiUrl.replace(/\/+$/, '') + '/';
  await page.route('**/api/**', route => route.request().url().startsWith(allowedBase) ? route.continue() : route.abort('blockedbyclient'));
}

/** Abre o app e aguarda o fim da apresentação inicial de 7 segundos. */
export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('startup-splash')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('startup-splash')).toHaveCount(0, { timeout: 12000 });
}

export const bottomTab = (page: Page, name: RegExp) => page.getByRole('tab', { name });
export const visible = (page: Page, testId: string) => page.getByTestId(testId).filter({ visible: true });
