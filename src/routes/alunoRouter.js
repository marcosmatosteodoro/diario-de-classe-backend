import express from 'express';
// Controladores
import { GetAlunoListController } from '../controllers/aluno/getAlunoListController.js';
import { GetAlunoController } from '../controllers/aluno/getAlunoController.js';
import { DeleteAlunoController } from '../controllers/aluno/deleteAlunoController.js';
// import { CreateAlunoController } from '../controllers/aluno/createAlunoController.js';
// import { UpdateAlunoController } from '../controllers/aluno/updateAlunoController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
// import { validateCreateAluno } from '../middlewares/aluno/validateCreateAluno.js';
// import { validateUpdateAluno } from '../middlewares/aluno/validateUpdateAluno.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';

const router = express.Router();

// GET /api/alunos - Buscar todos os alunos
router.get('/', validateSearchQuery, GetAlunoListController.handle);

// GET /api/alunos/:id - Buscar aluno por ID
router.get('/:id', validateId, GetAlunoController.handle);

// // POST /api/alunos - Criar novo aluno
// router.post('/', validateCreateAluno, CreateAlunoController.handle);

// // PUT /api/alunos/:id - Atualizar aluno por ID
// router.put('/:id', validateId, validateUpdateAluno, UpdateAlunoController.handle);

// DELETE /api/alunos/:id - Deletar aluno por ID
router.delete('/:id', validateId, DeleteAlunoController.handle);

export default router;
