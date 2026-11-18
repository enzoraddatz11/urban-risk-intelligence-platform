import { describe, expect, it } from 'vitest';
import { findPersonalData } from '@/features/privacy';

// Mesmos casos do PersonalDataGuardTest do backend: app e servidor aplicam a mesma regra.
describe('relatos sem dados pessoais', () => {
  it.each([
    'Falar comigo em morador.rua7@email.com.br',
    'Meu CPF é 123.456.789-09',
    'cpf 12345678909 para contato',
    'Liguem (11) 98765-4321',
    'whats 11987654321',
    '+55 11 3456-7890 da associação',
    'Meu nome é Maria e a rua alagou',
    'me chamo joão, a luz caiu',
  ])('recusa: %s', text => { expect(findPersonalData(text).length).toBeGreaterThan(0); });
  it.each([
    'Água subiu 30 cm às 14h na rua 25 de Março.',
    'Chuva de 61 mm/h desde 2026, perto do número 1500.',
    'Falta de luz no quarteirão; semáforos apagados há 2 horas.',
    'CEP da região 01234-567, bueiro entupido.',
    'Sou morador há 10 anos e nunca vi tanto calor.',
  ])('aceita: %s', text => { expect(findPersonalData(text)).toEqual([]); });
  it('identifica o tipo de dado encontrado', () => {
    expect(findPersonalData('a@b.com ou (21) 2345-6789')).toEqual(['e-mail', 'telefone']);
  });
});
