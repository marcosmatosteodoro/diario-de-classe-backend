import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { jest } from '@jest/globals';
import { coletarCreateServices } from '../../../mocks/coletorCreateServices.js';
import {
  compararContasFixas,
  lerContasFixasDoExemplo
} from '../../../mocks/contasFixasConsistentes.js';
import { executarEtapas } from '../../../../src/db/seeds/seedEtapas.js';
import { ConfiguracaoEscolaSeed } from '../../../../src/db/seeds/models/configuracaoEscolaSeed.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

const LINHA = '# DEMO_CONTAS_FIXAS=';

describe('consistência da lista de contas fixas do .env.example com o seed', () => {
  const exemplo = readFileSync(new URL('../../../../.env.example', import.meta.url), 'utf8');
  let enviados;

  beforeAll(async () => {
    const coletor = coletarCreateServices();
    jest.spyOn(ConfiguracaoEscolaSeed, 'handle').mockResolvedValue({ configuracoes: 1, dias: [] });
    jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
    await executarEtapas({ hoje: '2026-11-20', senha: 'senha-sentinela-consistencia' });
    enviados = coletor.argumentos.usuario.map(({ email, permissao }) => ({ email, permissao }));
    jest.restoreAllMocks();
  });

  const contasDoTexto = linha => lerContasFixasDoExemplo(`${LINHA}${linha}\n`);

  test('o seed envia 5 usuários (a base da comparação não é vazia)', () => {
    expect(enviados).toHaveLength(5);
  });

  test('caso íntegro: a lista do arquivo é exatamente a das duas contas fixas e não diverge', () => {
    const contas = lerContasFixasDoExemplo(exemplo);

    expect(contas).toEqual(['admin.demo@example.com', 'professor.demo@example.com']);
    expect(compararContasFixas(contas, enviados)).toEqual([]);
  });

  test.each([
    [
      '(i) só a caixa do e-mail do admin',
      'Admin.demo@example.com,professor.demo@example.com',
      'sem correspondente idêntico'
    ],
    [
      '(ii) e-mail diferente',
      'admin.demo2@example.com,professor.demo@example.com',
      'sem correspondente idêntico'
    ],
    ['(iii) lista com 1 item', 'admin.demo@example.com', 'a lista tem 1 e-mails']
  ])('divergência %s é detectada', (_nome, linha, trecho) => {
    const divergencias = compararContasFixas(contasDoTexto(linha), enviados);

    expect(divergencias.length).toBeGreaterThan(0);
    expect(divergencias.some(d => d.includes(trecho))).toBe(true);
  });

  test('(iv) um segundo admin entre os enviados deixa a única admin de valer', () => {
    const contas = lerContasFixasDoExemplo(exemplo);
    const comSegundoAdmin = [...enviados, { email: 'outro.admin@example.com', permissao: 'admin' }];

    expect(compararContasFixas(contas, comSegundoAdmin).length).toBeGreaterThan(0);
  });

  test('conta fixa que não é admin e deixa de ser member diverge', () => {
    const contas = lerContasFixasDoExemplo(exemplo);
    const rebaixada = enviados.map(u =>
      u.email === 'professor.demo@example.com' ? { ...u, permissao: 'guest' } : u
    );

    expect(compararContasFixas(contas, rebaixada).length).toBeGreaterThan(0);
  });

  test('(v) texto sem a linha lança, nunca devolve vazio', () => {
    expect(() => lerContasFixasDoExemplo('DEMO_MODE=true\n')).toThrow();
    expect(() => lerContasFixasDoExemplo(`  ${LINHA}a@example.com\n`)).toThrow();
  });
});
