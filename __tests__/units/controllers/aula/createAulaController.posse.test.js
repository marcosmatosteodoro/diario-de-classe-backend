import { jest } from '@jest/globals';
import { CreateAulaController } from '../../../../src/controllers/aula/createAulaController.js';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';
import { IsAulaExistsService } from '../../../../src/services/aula/isAulaExistsService.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

describe('CreateAulaController - professor da aula', () => {
  const OUTRO = 'prof-de-outro';
  let res;

  const buildReq = user => ({
    body: { idAluno: 'aluno-1', idProfessor: OUTRO, idContrato: 'ctr-1', dataAula: '2026-01-01' },
    user,
    t: key => key
  });

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.spyOn(IsAulaExistsService, 'handle').mockResolvedValue(false);
    jest.spyOn(CreateAulaService, 'handle').mockResolvedValue({ id: 'a1', idContrato: 'ctr-1' });
    jest.spyOn(UpdateAulasContratoService, 'handle').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('nao-admin: idProfessor do body e ignorado e a aula nasce com req.user.id', async () => {
    await CreateAulaController.handle(buildReq({ id: 'prof-dono', isAdmin: false }), res);

    expect(CreateAulaService.handle.mock.calls[0][0].idProfessor).toBe('prof-dono');
    expect(IsAulaExistsService.handle.mock.calls[0][0].idProfessor).toBe('prof-dono');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('admin: idProfessor do body e mantido', async () => {
    await CreateAulaController.handle(buildReq({ id: 'adm', isAdmin: true }), res);

    expect(CreateAulaService.handle.mock.calls[0][0].idProfessor).toBe(OUTRO);
  });

  test('nao-admin sem id: nega com 403 e nao cria', async () => {
    await CreateAulaController.handle(buildReq({ isAdmin: false }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(CreateAulaService.handle).not.toHaveBeenCalled();
  });
});
