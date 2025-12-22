import express from 'express';
// Controladores
import { GetAlunoListController } from '../controllers/aluno/getAlunoListController.js';
import { GetAlunoController } from '../controllers/aluno/getAlunoController.js';
import { DeleteAlunoController } from '../controllers/aluno/deleteAlunoController.js';
import { CreateAlunoController } from '../controllers/aluno/createAlunoController.js';
import { UpdateAlunoController } from '../controllers/aluno/updateAlunoController.js';
import { GetDiaAulaListByAlunoController } from '../controllers/diaAula/getDiaAulaListByAlunoController.js';
import { GetContratoByAlunoController } from '../controllers/contrato/getContratoByAlunoController.js';
import { GetAulasByAlunoController } from '../controllers/aula/getAulasByAlunoController.js';
import { GetContratosByAlunoController } from '../controllers/contrato/getContratosByAlunoController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateCreateAluno } from '../middlewares/aluno/validateCreateAluno.js';
import { validateUpdateAluno } from '../middlewares/aluno/validateUpdateAluno.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';

const router = express.Router();

// GET /api/alunos - Buscar todos os alunos
router.get('/', validateSearchQuery, GetAlunoListController.handle);

// GET /api/alunos/:id - Buscar aluno por ID
router.get('/:id', validateId, GetAlunoController.handle);

// POST /api/alunos - Criar novo aluno
router.post('/', validateCreateAluno, CreateAlunoController.handle);

// PUT /api/alunos/:id - Atualizar aluno por ID
router.put('/:id', validateId, validateUpdateAluno, UpdateAlunoController.handle);

// DELETE /api/alunos/:id - Deletar aluno por ID
router.delete('/:id', validateId, DeleteAlunoController.handle);

// GET /api/alunos/:id/dias-aulas - Buscar dias de aulas de um aluno
router.get('/:id/dias-aulas', validateId, GetDiaAulaListByAlunoController.handle);

// GET /api/alunos/:id/contrato - Buscar contrato ativo ou pendente de um aluno
router.get('/:id/contrato', validateId, GetContratoByAlunoController.handle);

// GET /api/alunos/:id/contrato - Buscar contrato ativo ou pendente de um aluno
router.get('/:id/contratos', validateId, GetContratosByAlunoController.handle);

// GET /api/alunos/:id/aulas - Buscar todas as aulas do aluno pelo ID
router.get('/:id/aulas', validateId, GetAulasByAlunoController.handle);

export default router;
