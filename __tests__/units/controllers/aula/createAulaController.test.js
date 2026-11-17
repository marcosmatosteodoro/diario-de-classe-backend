import { CreateAulaController } from '../../../../src/controllers/aula/createAulaController.js';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';
import { IsAulaExistsService } from '../../../../src/services/aula/isAulaExistsService.js';
import { GetContratoListService } from '../../../../src/services/contrato/getContratoListService.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

describe('CreateAulaController - vínculo contrato↔aluno', () => {
  let originals, calls, contratoLookups, professorTemPosse;

  const buildReq = user => ({
    user,
    body: {
      idAluno: 'aluno-1',
      idContrato: 'contrato-1',
      idProfessor: 'prof-1',
      dataAula: '2025-01-10'
    },
    t: key => key
  });

  const buildRes = () => ({
    statusCode: null,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  });

  // Simula o banco: o único contrato existente é 'contrato-1', do 'aluno-1'
  const contratoDoBanco = async (id, params) => {
    contratoLookups.push({ id, ...params.additionalWhere });
    const where = { id, ...params.additionalWhere };
    return where.id === 'contrato-1' && where.idAluno === 'aluno-1' ? { id } : null;
  };

  beforeEach(() => {
    calls = [];
    contratoLookups = [];
    professorTemPosse = true;
    originals = {
      lista: GetContratoListService.handle,
      contrato: GetContratoService.handle,
      exists: IsAulaExistsService.handle,
      create: CreateAulaService.handle,
      update: UpdateAulasContratoService.handle
    };
    GetContratoService.handle = contratoDoBanco;
    GetContratoListService.handle = async () => (professorTemPosse ? [{ id: 'contrato-1' }] : []);
    IsAulaExistsService.handle = async () => {
      calls.push('exists');
      return false;
    };
    CreateAulaService.handle = async data => {
      calls.push('create');
      return { id: 'aula-1', ...data };
    };
    UpdateAulasContratoService.handle = async () => {
      calls.push('recalc');
    };
  });

  afterEach(() => {
    GetContratoService.handle = originals.contrato;
    GetContratoListService.handle = originals.lista;
    IsAulaExistsService.handle = originals.exists;
    CreateAulaService.handle = originals.create;
    UpdateAulasContratoService.handle = originals.update;
  });

  test.each([
    ['admin', { id: 'u1', isAdmin: true }],
    ['não-admin', { id: 'prof-1', isAdmin: false }]
  ])('recusa 422 e não escreve com contrato de outro aluno (%s)', async (_nome, user) => {
    const req = buildReq(user);
    req.body.idAluno = 'aluno-2';
    const res = buildRes();

    await CreateAulaController.handle(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.data.message).toBe('aulas.create.contrato_nao_pertence_ao_aluno');
    expect(calls).toEqual([]);
  });

  test('recusa 422 e não escreve com contrato inexistente', async () => {
    const req = buildReq({ id: 'u1', isAdmin: true });
    req.body.idContrato = 'contrato-fantasma';
    const res = buildRes();

    await CreateAulaController.handle(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.data.message).toBe('aulas.create.contrato_nao_pertence_ao_aluno');
    expect(calls).toEqual([]);
  });

  test.each([
    ['idAluno ausente', { idAluno: undefined }],
    ['idAluno vazio', { idAluno: '' }],
    ['idContrato ausente', { idContrato: undefined }],
    ['idContrato vazio', { idContrato: '' }]
  ])('recusa 422 sem consultar o contrato quando %s', async (_nome, override) => {
    const req = buildReq({ id: 'u1', isAdmin: true });
    Object.assign(req.body, override);
    const res = buildRes();

    await CreateAulaController.handle(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.data.message).toBe('aulas.create.contrato_nao_pertence_ao_aluno');
    expect(contratoLookups).toEqual([]);
    expect(calls).toEqual([]);
  });

  test('busca o contrato filtrando por id e idAluno do body', async () => {
    await CreateAulaController.handle(buildReq({ id: 'u1', isAdmin: true }), buildRes());

    expect(contratoLookups).toEqual([{ id: 'contrato-1', idAluno: 'aluno-1' }]);
  });

  test('par correto segue o fluxo atual e responde 201', async () => {
    const res = buildRes();

    await CreateAulaController.handle(buildReq({ id: 'u1', isAdmin: true }), res);

    expect(res.statusCode).toBe(201);
    expect(res.data.status).toBe('AGENDADA');
    expect(calls).toEqual(['exists', 'create', 'recalc']);
  });

  test('não-admin sem posse com par inválido recebe 403 (não 422) e o contrato não é consultado', async () => {
    professorTemPosse = false;
    const req = buildReq({ id: 'prof-1', isAdmin: false });
    req.body.idAluno = 'aluno-2';
    const res = buildRes();

    await CreateAulaController.handle(req, res);

    expect(res.statusCode).toBe(403);
    expect(contratoLookups).toEqual([]);
    expect(calls).toEqual([]);
  });
});
