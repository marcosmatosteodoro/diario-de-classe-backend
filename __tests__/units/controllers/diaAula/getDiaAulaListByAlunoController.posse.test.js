import { jest } from '@jest/globals';
import { GetDiaAulaListByAlunoController } from '../../../../src/controllers/diaAula/getDiaAulaListByAlunoController.js';
import { GetDiaAulaListService } from '../../../../src/services/diaAula/getDiaAulaListService.js';

describe('GetDiaAulaListByAlunoController - filtro de dono', () => {
  const USER = 'prof-dono';
  const ALVO = 'recurso-de-outro-dono';
  let res;

  const buildReq = user => ({
    params: { id: ALVO },
    user,
    t: key => key
  });

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.spyOn(GetDiaAulaListService, 'handle').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('nao-admin: posse permanece no where junto do filtro de negocio (param de outro dono)', async () => {
    await GetDiaAulaListByAlunoController.handle(buildReq({ id: USER, isAdmin: false }), res);

    expect(GetDiaAulaListService.handle).toHaveBeenCalledTimes(1);
    expect(GetDiaAulaListService.handle.mock.calls[0][0]).toEqual({
      AND: [
        { aluno: { OR: [{ aulas: { some: { idProfessor: USER } } }, { criador: USER }] } },
        { idAluno: ALVO }
      ]
    });
  });

  test('nao-admin: param nao sobrescreve a posse nem a chave AND', async () => {
    await GetDiaAulaListByAlunoController.handle(buildReq({ id: USER, isAdmin: false }), res);

    const where = GetDiaAulaListService.handle.mock.calls[0][0];
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0]).toEqual({
      aluno: { OR: [{ aulas: { some: { idProfessor: USER } } }, { criador: USER }] }
    });
  });

  test('nao-admin sem id: nega com 403 e nao consulta o service', async () => {
    await GetDiaAulaListByAlunoController.handle(buildReq({ isAdmin: false }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(GetDiaAulaListService.handle).not.toHaveBeenCalled();
  });

  test('admin: where contem so o filtro de negocio', async () => {
    await GetDiaAulaListByAlunoController.handle(buildReq({ id: 'adm', isAdmin: true }), res);

    expect(GetDiaAulaListService.handle.mock.calls[0][0]).toEqual({ idAluno: ALVO });
  });
});
