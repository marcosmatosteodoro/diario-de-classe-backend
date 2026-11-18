import { readFileSync, readdirSync } from 'node:fs';
import { jest } from '@jest/globals';
import { coletarCreateServices } from '../../../mocks/coletorCreateServices.js';
import { executarEtapas } from '../../../../src/db/seeds/seedEtapas.js';
import { ConfiguracaoEscolaSeed } from '../../../../src/db/seeds/models/configuracaoEscolaSeed.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

const SENHA = 'senha-sentinela-etapas';
const LITERAL_DE_SENHA = /^\s*senha\s*:\s*['"`]/;

describe('contas criadas pelo seed', () => {
  const seedPasswordOriginal = process.env.SEED_PASSWORD;
  let coletor;

  beforeEach(async () => {
    process.env.SEED_PASSWORD = 'outra-senha-de-ambiente';
    coletor = coletarCreateServices();
    jest
      .spyOn(ConfiguracaoEscolaSeed, 'handle')
      .mockImplementation(async () => ({ configuracoes: 1, dias: [] }));
    jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
    await executarEtapas({ hoje: '2026-11-20', senha: SENHA });
  });

  afterEach(() => {
    if (seedPasswordOriginal === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = seedPasswordOriginal;
    jest.restoreAllMocks();
  });

  test('5 contas: 1 admin (a fixa), a fixa de professor e 3 membros', () => {
    const contas = coletor.argumentos.usuario;
    expect(contas).toHaveLength(5);

    const admins = contas.filter(c => c.permissao === 'admin');
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe('admin.demo@example.com');

    const professor = contas.find(c => c.email === 'professor.demo@example.com');
    expect(professor.permissao).toBe('member');
    expect(contas.filter(c => c.permissao === 'member')).toHaveLength(4);
  });

  test('as 5 contas levam resetarSenha false e as fixas têm e-mail em minúsculas', () => {
    const contas = coletor.argumentos.usuario;
    for (const conta of contas) expect(conta.resetarSenha).toBe(false);

    for (const email of ['admin.demo@example.com', 'professor.demo@example.com']) {
      const conta = contas.find(c => c.email.toLowerCase() === email);
      expect(conta.email).toBe(email);
    }
  });

  test('a senha vem do parâmetro de executarEtapas, não do ambiente', () => {
    expect(process.env.SEED_PASSWORD).toBe('outra-senha-de-ambiente');
    expect(coletor.argumentos.usuario.map(c => c.senha)).toEqual(Array(5).fill(SENHA));
  });

  test('nenhum arquivo do seed tem literal de senha', () => {
    expect(LITERAL_DE_SENHA.test("senha: 'literal'")).toBe(true);

    const arquivos = readdirSync('src/db/seeds', { recursive: true, withFileTypes: true })
      .filter(e => e.isFile())
      .map(e => `${e.parentPath}/${e.name}`);
    expect(arquivos.length).toBeGreaterThan(10);

    const linhas = arquivos.flatMap(a =>
      readFileSync(a, 'utf8')
        .split('\n')
        .filter(l => LITERAL_DE_SENHA.test(l))
    );
    expect(linhas).toEqual([]);
  });
});
