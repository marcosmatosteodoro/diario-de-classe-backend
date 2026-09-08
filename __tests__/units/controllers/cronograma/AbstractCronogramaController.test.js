import { jest } from '@jest/globals';
import { AbstractCronogramaController } from '../../../../src/controllers/cronograma/AbstractCronogramaController.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';

const fazerReq = (isAdmin, id = 'professor-1') => ({
  user: { id, isAdmin },
  params: {},
  body: {},
  query: {},
  t: chave => chave
});

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

// Subclasse mínima: AbstractCronogramaController não implementa execute().
class Controller extends AbstractCronogramaController {}

describe('AbstractCronogramaController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('não filtra nada para admin', () => {
    const controller = new Controller(fazerReq(true), fazerRes());

    expect(controller.whereAluno).toEqual({});
    expect(controller.where).toEqual({});
  });

  it('restringe professor não-admin ao aluno que ele atende ou criou', () => {
    const controller = new Controller(fazerReq(false, 'professor-7'), fazerRes());

    expect(controller.whereAluno).toEqual({
      OR: [{ aulas: { some: { idProfessor: 'professor-7' } } }, { criador: 'professor-7' }]
    });
  });

  it('aninha o filtro em `aluno` para consultar CronogramaAluno', () => {
    const controller = new Controller(fazerReq(false, 'professor-7'), fazerRes());

    // As consultas caem em entidades diferentes: Aluno usa whereAluno, e
    // CronogramaAluno precisa do filtro aninhado.
    expect(controller.where).toEqual({ aluno: controller.whereAluno });
  });

  it('repassa o filtro de autorização ao buscar o aluno', async () => {
    const spy = jest.spyOn(GetAlunoService, 'handle').mockResolvedValue(null);
    const controller = new Controller(fazerReq(false, 'professor-7'), fazerRes());

    await controller.getAlunoAcessivel('aluno-1');

    expect(spy).toHaveBeenCalledWith('aluno-1', controller.whereAluno);
  });

  it('devolve null quando o aluno existe mas não é do professor', async () => {
    // O service não encontra porque o where de autorização não casa: o
    // controller trata como 404, sem revelar que o cadastro existe.
    jest.spyOn(GetAlunoService, 'handle').mockResolvedValue(null);
    const controller = new Controller(fazerReq(false), fazerRes());

    await expect(controller.getAlunoAcessivel('aluno-alheio')).resolves.toBeNull();
  });
});
