import { jest } from '@jest/globals';
import { UpdateConteudoAulaController } from '../../../../src/controllers/aula/updateConteudoAulaController.js';
import { GetAulaService } from '../../../../src/services/aula/getAulaService.js';
import { UpdateConteudoAulaService } from '../../../../src/services/aula/updateConteudoAulaService.js';
import { IsConteudoCongeladoEmOutraAulaService } from '../../../../src/services/aula/isConteudoCongeladoEmOutraAulaService.js';
import { GetConteudoLivroService } from '../../../../src/services/conteudoLivro/getConteudoLivroService.js';
import { GetCronogramaAtivoService } from '../../../../src/services/cronograma/getCronogramaAtivoService.js';
import { ResequenciarCronogramaService } from '../../../../src/services/cronograma/resequenciarCronogramaService.js';

const fazerRes = () => {
  const res = { statusCode: null, body: null };
  res.status = code => {
    res.statusCode = code;
    return res;
  };
  res.json = body => {
    res.body = body;
    return res;
  };
  return res;
};

const fazerReq = (validatedData, isAdmin = false) => ({
  user: { id: 'professor-1', isAdmin },
  params: { id: 'aula-1' },
  validatedId: 'aula-1',
  body: validatedData,
  validatedData,
  query: {},
  t: chave => chave
});

const aula = (overrides = {}) => ({
  id: 'aula-1',
  idContrato: 'contrato-1',
  idProfessor: 'professor-1',
  status: 'AGENDADA',
  tipo: 'PADRAO',
  idConteudo: null,
  conteudoManual: false,
  ...overrides
});

describe('UpdateConteudoAulaController', () => {
  beforeEach(() => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue(aula());
    jest
      .spyOn(GetCronogramaAtivoService, 'handle')
      .mockResolvedValue({ id: 'cron-1', idLivro: 'livro-1' });
    jest
      .spyOn(GetConteudoLivroService, 'handle')
      .mockResolvedValue({ id: 'conteudo-1', idLivro: 'livro-1' });
    jest.spyOn(IsConteudoCongeladoEmOutraAulaService, 'handle').mockResolvedValue(false);
    jest
      .spyOn(UpdateConteudoAulaService, 'handle')
      .mockResolvedValue({ id: 'aula-1', idConteudo: 'conteudo-1' });
    jest
      .spyOn(ResequenciarCronogramaService, 'handle')
      .mockResolvedValue({ resequenciado: true, aulasAtualizadas: 2 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const executar = async (validatedData = { idConteudo: 'conteudo-1' }) => {
    const res = fazerRes();
    await UpdateConteudoAulaController.handle(fazerReq(validatedData), res);
    return res;
  };

  it('lança o conteúdo e resequencia o contrato', async () => {
    const res = await executar();

    expect(res.statusCode).toBe(200);
    expect(UpdateConteudoAulaService.handle).toHaveBeenCalledWith('aula-1', 'conteudo-1');
    expect(ResequenciarCronogramaService.handle).toHaveBeenCalledWith('contrato-1');
  });

  it('leva o filtro de autorização do professor ao buscar a aula', async () => {
    await executar();

    expect(GetAulaService.handle).toHaveBeenCalledWith('aula-1', {
      idProfessor: 'professor-1'
    });
  });

  it('responde 404 quando a aula não é do professor', async () => {
    GetAulaService.handle.mockResolvedValue(null);

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(UpdateConteudoAulaService.handle).not.toHaveBeenCalled();
  });

  it('recusa aula que não consome conteúdo (falta)', async () => {
    GetAulaService.handle.mockResolvedValue(aula({ status: 'CANCELADA_POR_FALTA' }));

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('aulas.conteudo.aula_nao_consome');
    expect(UpdateConteudoAulaService.handle).not.toHaveBeenCalled();
  });

  it('recusa aula do tipo OUTRA', async () => {
    GetAulaService.handle.mockResolvedValue(aula({ tipo: 'OUTRA' }));

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('aulas.conteudo.aula_nao_consome');
  });

  it('recusa quando o contrato não tem livro em curso', async () => {
    GetCronogramaAtivoService.handle.mockResolvedValue(null);

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('aulas.conteudo.sem_cronograma');
  });

  it('responde 404 quando o conteúdo não existe', async () => {
    GetConteudoLivroService.handle.mockResolvedValue(null);

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('conteudosLivro.get.not_found');
  });

  it('recusa conteúdo de outro livro passado no corpo', async () => {
    GetConteudoLivroService.handle.mockResolvedValue({
      id: 'conteudo-9',
      idLivro: 'livro-outro'
    });

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('aulas.conteudo.fora_do_livro');
    expect(UpdateConteudoAulaService.handle).not.toHaveBeenCalled();
  });

  it('recusa conteúdo já preso a outra aula do contrato', async () => {
    IsConteudoCongeladoEmOutraAulaService.handle.mockResolvedValue(true);

    const res = await executar();

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('aulas.conteudo.ja_vinculado');
  });

  it('aceita idConteudo nulo, devolvendo a aula ao controle automático', async () => {
    const res = await executar({ idConteudo: null });

    expect(res.statusCode).toBe(200);
    expect(UpdateConteudoAulaService.handle).toHaveBeenCalledWith('aula-1', null);
    // Sem conteúdo escolhido não há o que validar contra o livro.
    expect(GetConteudoLivroService.handle).not.toHaveBeenCalled();
  });

  it('relê a aula depois do resequenciamento, não antes', async () => {
    // Ao soltar a aula, o resequenciador já regrava um conteúdo. Devolver o
    // objeto capturado antes fazia o front exibir nulo com outro valor no banco.
    GetAulaService.handle
      .mockResolvedValueOnce(aula())
      .mockResolvedValueOnce(aula({ idConteudo: 'conteudo-3' }));

    const res = await executar({ idConteudo: null });

    expect(res.body.idConteudo).toBe('conteudo-3');
    expect(GetAulaService.handle).toHaveBeenCalledTimes(2);
  });
});
