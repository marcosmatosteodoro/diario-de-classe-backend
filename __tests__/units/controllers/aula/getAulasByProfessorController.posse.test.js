import { jest } from '@jest/globals';
import { GetAulasByProfessorController } from '../../../../src/controllers/aula/getAulasByProfessorController.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';

describe('GetAulasByProfessorController - filtro de dono', () => {
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
    jest.spyOn(GetAulaListService, 'handle').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('nao-admin: posse permanece no where junto do filtro de negocio (param de outro dono)', async () => {
    await GetAulasByProfessorController.handle(buildReq({ id: USER, isAdmin: false }), res);

    expect(GetAulaListService.handle).toHaveBeenCalledTimes(1);
    expect(GetAulaListService.handle.mock.calls[0][0]).toEqual({
      AND: [{ idProfessor: USER }, { idProfessor: ALVO }]
    });
  });

  test('nao-admin: param nao sobrescreve a posse nem a chave AND', async () => {
    await GetAulasByProfessorController.handle(buildReq({ id: USER, isAdmin: false }), res);

    const where = GetAulaListService.handle.mock.calls[0][0];
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0]).toEqual({ idProfessor: USER });
  });

  test('nao-admin sem id: nega com 403 e nao consulta o service', async () => {
    await GetAulasByProfessorController.handle(buildReq({ isAdmin: false }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(GetAulaListService.handle).not.toHaveBeenCalled();
  });

  test('admin: where contem so o filtro de negocio', async () => {
    await GetAulasByProfessorController.handle(buildReq({ id: 'adm', isAdmin: true }), res);

    expect(GetAulaListService.handle.mock.calls[0][0]).toEqual({ idProfessor: ALVO });
  });
});
