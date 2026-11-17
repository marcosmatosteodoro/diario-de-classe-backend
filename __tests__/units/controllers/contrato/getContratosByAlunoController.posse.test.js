import { jest } from '@jest/globals';
import { GetContratosByAlunoController } from '../../../../src/controllers/contrato/getContratosByAlunoController.js';
import { GetContratoListService } from '../../../../src/services/contrato/getContratoListService.js';

describe('GetContratosByAlunoController - filtro de dono', () => {
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
    jest.spyOn(GetContratoListService, 'handle').mockResolvedValue([{ id: 'c1' }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('nao-admin: posse permanece no where junto do filtro de negocio (param de outro dono)', async () => {
    await GetContratosByAlunoController.handle(buildReq({ id: USER, isAdmin: false }), res);

    expect(GetContratoListService.handle).toHaveBeenCalledTimes(1);
    expect(GetContratoListService.handle.mock.calls[0][0]).toEqual({
      AND: [{ aulas: { some: { idProfessor: USER } } }, { idAluno: ALVO }]
    });
  });

  test('nao-admin: param nao sobrescreve a posse nem a chave AND', async () => {
    await GetContratosByAlunoController.handle(buildReq({ id: USER, isAdmin: false }), res);

    const where = GetContratoListService.handle.mock.calls[0][0];
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0]).toEqual({ aulas: { some: { idProfessor: USER } } });
  });

  test('nao-admin sem id: nega com 403 e nao consulta o service', async () => {
    await GetContratosByAlunoController.handle(buildReq({ isAdmin: false }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(GetContratoListService.handle).not.toHaveBeenCalled();
  });

  test('admin: where contem so o filtro de negocio', async () => {
    await GetContratosByAlunoController.handle(buildReq({ id: 'adm', isAdmin: true }), res);

    expect(GetContratoListService.handle.mock.calls[0][0]).toEqual({ idAluno: ALVO });
  });
});
