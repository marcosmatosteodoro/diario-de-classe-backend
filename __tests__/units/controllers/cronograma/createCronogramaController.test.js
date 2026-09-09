import { jest } from '@jest/globals';
import { CreateCronogramaController } from '../../../../src/controllers/cronograma/createCronogramaController.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { GetLivroService } from '../../../../src/services/livro/getLivroService.js';
import { CreateCronogramaService } from '../../../../src/services/cronograma/createCronogramaService.js';
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

const fazerReq = (validatedData = {}) => ({
  user: { id: 'admin-1', isAdmin: true },
  params: { id: 'aluno-1' },
  validatedId: 'aluno-1',
  body: validatedData,
  validatedData,
  query: {},
  t: chave => chave
});

const dadosValidos = {
  idContrato: 'contrato-1',
  idLivro: 'livro-1',
  dataInicio: '2026-03-01'
};

const contrato = (overrides = {}) => ({
  id: 'contrato-1',
  idAluno: 'aluno-1',
  status: 'ATIVO',
  idioma: 'INGLES',
  ...overrides
});

const livro = (overrides = {}) => ({
  id: 'livro-1',
  ativo: true,
  idioma: 'INGLES',
  ...overrides
});

describe('CreateCronogramaController', () => {
  beforeEach(() => {
    jest.spyOn(GetAlunoService, 'handle').mockResolvedValue({ id: 'aluno-1' });
    jest.spyOn(GetContratoService, 'handle').mockResolvedValue(contrato());
    jest.spyOn(GetLivroService, 'handle').mockResolvedValue(livro());
    jest.spyOn(CreateCronogramaService, 'handle').mockResolvedValue({ id: 'cron-1' });
    jest.spyOn(ResequenciarCronogramaService, 'handle').mockResolvedValue({ resequenciado: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const executar = async (validatedData = dadosValidos) => {
    const res = fazerRes();
    await CreateCronogramaController.handle(fazerReq(validatedData), res);
    return res;
  };

  it('cria o cronograma e resequencia quando tudo é válido', async () => {
    const res = await executar();

    expect(res.statusCode).toBe(201);
    expect(CreateCronogramaService.handle).toHaveBeenCalledWith(
      expect.objectContaining({ idAluno: 'aluno-1', idLivro: 'livro-1' })
    );
    expect(ResequenciarCronogramaService.handle).toHaveBeenCalledWith('contrato-1');
  });

  it('responde 404 quando o aluno não é acessível ao professor', async () => {
    GetAlunoService.handle.mockResolvedValue(null);

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(CreateCronogramaService.handle).not.toHaveBeenCalled();
  });

  it('recusa contrato de outro aluno passado no corpo', async () => {
    // Sem esta checagem, um idContrato alheio criaria cronograma cruzado.
    GetContratoService.handle.mockResolvedValue(contrato({ idAluno: 'outro-aluno' }));

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('cronogramas.error.contrato_not_exists');
    expect(CreateCronogramaService.handle).not.toHaveBeenCalled();
  });

  it('responde 404 quando o livro não existe', async () => {
    GetLivroService.handle.mockResolvedValue(null);

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('cronogramas.error.livro_not_exists');
  });

  it('recusa livro inativo', async () => {
    GetLivroService.handle.mockResolvedValue(livro({ ativo: false }));

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('cronogramas.create.livro_inativo');
  });

  it('recusa contrato encerrado, que não tem aula futura', async () => {
    GetContratoService.handle.mockResolvedValue(contrato({ status: 'CANCELADO' }));

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('cronogramas.create.contrato_indisponivel');
    expect(CreateCronogramaService.handle).not.toHaveBeenCalled();
  });

  it('aceita contrato PENDENTE', async () => {
    GetContratoService.handle.mockResolvedValue(contrato({ status: 'PENDENTE' }));

    const res = await executar();

    expect(res.statusCode).toBe(201);
  });

  it('recusa livro de idioma diferente do contrato', async () => {
    GetLivroService.handle.mockResolvedValue(livro({ idioma: 'ESPANHOL' }));

    const res = await executar();

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('cronogramas.create.idioma_divergente');
    expect(CreateCronogramaService.handle).not.toHaveBeenCalled();
  });
});
