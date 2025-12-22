import express from 'express';
// Controladores
import { GetAulaListController } from '../controllers/aula/getAulaListController.js';
import { GetAulaController } from '../controllers/aula/getAulaController.js';
import { DeleteAulaController } from '../controllers/aula/deleteAulaController.js';
import { CreateAulaController } from '../controllers/aula/createAulaController.js';
import { UpdateAulaController } from '../controllers/aula/updateAulaController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateCreateAula } from '../middlewares/aula/validateCreateAula.js';
import { validateUpdateAula } from '../middlewares/aula/validateUpdateAula.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';

const router = express.Router();

// GET /api/aulas - Buscar todos os aulas
router.get('/', validateSearchQuery, GetAulaListController.handle);

// GET /api/aulas/:id - Buscar aula por ID
router.get('/:id', validateId, GetAulaController.handle);

// POST /api/aulas - Criar novo aula
router.post('/', validateCreateAula, CreateAulaController.handle);

// PUT /api/aulas/:id - Atualizar aula por ID
router.put('/:id', validateId, validateUpdateAula, UpdateAulaController.handle);

// DELETE /api/aulas/:id - Deletar aula por ID
router.delete('/:id', validateId, DeleteAulaController.handle);

export default router;
