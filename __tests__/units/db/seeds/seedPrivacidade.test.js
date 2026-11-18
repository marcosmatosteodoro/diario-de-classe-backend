import { jest } from '@jest/globals';
import { coletarCreateServices } from '../../../mocks/coletorCreateServices.js';
import { executarEtapas } from '../../../../src/db/seeds/seedEtapas.js';
import { ConfiguracaoEscolaSeed } from '../../../../src/db/seeds/models/configuracaoEscolaSeed.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

const EMAIL_FICTICIO = /^[^@\s]+@example\.com$/;
const LEGADO = 'vdvdsvdsvdsvdsvds';

const strings = valor => {
  if (typeof valor === 'string') return [valor];
  if (valor instanceof Date) return [];
  if (Array.isArray(valor)) return valor.flatMap(strings);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(strings);
  return [];
};

const emails = args => [...args.usuario.map(u => u.email), ...args.aluno.map(a => a.email)];
const foraDoDominio = args => emails(args).filter(e => !EMAIL_FICTICIO.test(e));
const mencionaBls = args => strings(args).filter(s => /bls/i.test(s));
const comTelefone = args =>
  Object.values(args)
    .flat()
    .filter(item => item.telefone !== null && item.telefone !== undefined);
const observacoesLegadas = args => args.aula.filter(a => a.observacao === LEGADO);

describe('privacidade do que chega aos Create*Service', () => {
  let coletor;
  let args;

  beforeEach(async () => {
    coletor = coletarCreateServices();
    jest
      .spyOn(ConfiguracaoEscolaSeed, 'handle')
      .mockImplementation(async () => ({ configuracoes: 1, dias: [] }));
    jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
    await executarEtapas({ hoje: '2026-11-20', senha: 'senha-sentinela-etapas' });
    args = coletor.argumentos;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('os 13 e-mails (5 de usuário e 8 de aluno) são de example.com', () => {
    expect(emails(args)).toHaveLength(13);
    expect(foraDoDominio(args)).toEqual([]);
  });

  test('nenhum valor string cita "bls"', () => {
    expect(mencionaBls(args)).toEqual([]);
  });

  test('nenhum telefone preenchido', () => {
    expect(comTelefone(args)).toEqual([]);
  });

  test('controles positivos: cada predicado aponta 1 ocorrência numa cópia adulterada', () => {
    const copia = JSON.parse(JSON.stringify(args));
    copia.usuario[0].email = 'x@gmail.com';
    expect(foraDoDominio(copia)).toEqual(['x@gmail.com']);

    const copiaBls = JSON.parse(JSON.stringify(args));
    copiaBls.usuario[0].nome = 'Escola BLS Idiomas';
    expect(mencionaBls(copiaBls)).toEqual(['Escola BLS Idiomas']);

    const copiaTel = JSON.parse(JSON.stringify(args));
    copiaTel.aluno[0].telefone = '11987654321';
    expect(comTelefone(copiaTel)).toHaveLength(1);
  });

  test('observações: sem o texto legado, uma frase por status, em pt-BR', () => {
    expect(observacoesLegadas(args)).toEqual([]);

    const raiz = {
      CONCLUIDA: 'aula',
      CANCELADA: 'cancel',
      CANCELADA_POR_FALTA: 'falta',
      AGENDADA: 'aula'
    };
    const status = [...new Set(args.aula.map(a => a.status))];
    expect(status.sort()).toEqual(Object.keys(raiz).sort());

    const frases = new Set(args.aula.map(a => a.observacao));
    expect(frases.size).toBe(status.length);
    for (const s of status) {
      const dasAulas = new Set(args.aula.filter(a => a.status === s).map(a => a.observacao));
      expect(dasAulas.size).toBe(1);
      expect([...dasAulas][0].toLowerCase()).toContain(raiz[s]);
    }
  });

  test('nome e sobrenome de usuário e aluno são strings não vazias', () => {
    for (const pessoa of [...args.usuario, ...args.aluno]) {
      expect(typeof pessoa.nome).toBe('string');
      expect(pessoa.nome.trim()).not.toBe('');
      expect(typeof pessoa.sobrenome).toBe('string');
      expect(pessoa.sobrenome.trim()).not.toBe('');
    }
  });

  test('controle de detecção: a observação legada numa cópia adulterada é apontada', () => {
    const copia = JSON.parse(JSON.stringify(args));
    copia.aula[0].observacao = LEGADO;
    expect(observacoesLegadas(copia)).toHaveLength(1);
  });
});
