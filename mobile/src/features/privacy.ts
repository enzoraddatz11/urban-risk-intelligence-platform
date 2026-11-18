/**
 * Espelha a regra do backend (PersonalDataGuard): relatos comunitários não podem conter
 * e-mail, CPF, telefone ou nome declarado. Verificar no app evita o envio desses dados à rede.
 */
const patterns: [string, RegExp][] = [
  ['e-mail', /[\w.+-]+@[\w-]+(\.[\w-]+)+/u],
  ['CPF', /(?<!\d)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?!\d)/u],
  ['telefone', /(?<!\d)(\+?55\s?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}(?!\d)/u],
  ['nome', /(^|[^\p{L}])(meu nome é|me chamo)\s+\p{L}/iu],
];
export function findPersonalData(text: string): string[] {
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
export const PRIVACY_MESSAGE = 'Remova dados pessoais do relato (e-mail, CPF, telefone ou nome). Descreva apenas a situação observada.';
