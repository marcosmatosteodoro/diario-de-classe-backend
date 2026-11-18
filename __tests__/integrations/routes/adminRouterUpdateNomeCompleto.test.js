import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import routes from '../../../src/routes.js';
import { tokenDe } from '../../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';
import { GetUserListService } from '../../../src/services/user/getUserListService.js';
import { GetAlunoListService } from '../../../src/services/aluno/getAlunoListService.js';
import { UpdateUserService } from '../../../src/services/user/updateUserService.js';
import { UpdateAlunoService } from '../../../src/services/aluno/updateAlunoService.js';

const professor = {
  id: 'prof-1',
  nome: 'Ana',
  sobrenome: 'Lima',
  nomeCompleto: 'desatualizado',
  email: 'ana.lima@example.com',
  telefone: '11911110000'
};
const outroProfessor = {
  id: 'prof-2',
  nome: 'Bia',
  sobrenome: 'Souza',
  nomeCompleto: 'Bia Souza',
  email: 'bia.souza@example.com',
  telefone: '11922220000'
};
const aluno = {
  id: 'aluno-1',
  nome: 'Caio',
  sobrenome: 'Reis',
  nomeCompleto: 'desatualizado',
  email: 'caio.reis@example.com',
  telefone: '11933330000'
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  app.use('/', routes);
  return app;
}

const adminToken = () => `Bearer ${tokenDe({ id: 'admin-1', role: 'admin' })}`;

describe('/admin/update-nomeCompleto (router real de src/routes.js)', () => {
  let app;
  const originals = {};

  beforeEach(() => {
    sessaoAtiva('admin-1', 'm-1');
    app = buildApp();
    originals.list = GetUserListService.handle;
    originals.alunoList = GetAlunoListService.handle;
    originals.update = UpdateUserService.handle;
    originals.alunoUpdate = UpdateAlunoService.handle;
    GetUserListService.handle = jest.fn().mockResolvedValue([professor, outroProfessor]);
    GetAlunoListService.handle = jest.fn().mockResolvedValue([aluno]);
    UpdateUserService.handle = jest.fn().mockRejectedValue(new Error('falha professor'));
    UpdateAlunoService.handle = jest.fn().mockRejectedValue(new Error('falha aluno'));
  });

  afterEach(() => {
    GetUserListService.handle = originals.list;
    GetAlunoListService.handle = originals.alunoList;
    UpdateUserService.handle = originals.update;
    UpdateAlunoService.handle = originals.alunoUpdate;
  });

  test('GET não existe mais: 404 e nenhuma atualização disparada', async () => {
    const response = await request(app)
      .get('/admin/update-nomeCompleto')
      .set('Authorization', adminToken());

    expect(response.status).toBe(404);
    expect(UpdateUserService.handle).not.toHaveBeenCalled();
    expect(UpdateAlunoService.handle).not.toHaveBeenCalled();
  });

  test('POST de admin atualiza; detalhesErros só com id, nomeCompleto e error (sem PII)', async () => {
    const response = await request(app)
      .post('/admin/update-nomeCompleto')
      .set('Authorization', adminToken());

    expect(response.status).toBe(200);
    expect(response.body.professores.detalhesErros).toEqual([
      { id: 'prof-1', nomeCompleto: 'Ana Lima', error: 'falha professor' }
    ]);
    expect(response.body.alunos.detalhesErros).toEqual([
      { id: 'aluno-1', nomeCompleto: 'Caio Reis', error: 'falha aluno' }
    ]);

    const corpo = JSON.stringify(response.body);
    ['example.com', '1191', '1192', '1193', 'Bia', 'prof-2'].forEach(termo =>
      expect(corpo).not.toContain(termo)
    );
  });

  test('POST de não-admin: 403', async () => {
    const response = await request(app)
      .post('/admin/update-nomeCompleto')
      .set('Authorization', `Bearer ${tokenDe({ id: 'm-1', role: 'member' })}`);

    expect(response.status).toBe(403);
    expect(UpdateUserService.handle).not.toHaveBeenCalled();
  });
});
