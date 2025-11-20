import express from 'express';
// Controladores
import { GetDiaAulaListController } from '../controllers/diaAula/getDiaAulaListController.js';
import { GetDiaAulaController } from '../controllers/diaAula/getDiaAulaController.js';
import { DeleteDiaAulaController } from '../controllers/diaAula/deleteDiaAulaController.js';
import { CreateDiaAulaController } from '../controllers/diaAula/createDiaAulaController.js';
// import { UpdateDiaAulaController } from '../controllers/diaAula/updateDiaAulaController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';
import { validateCreateDiaAula } from '../middlewares/diaAula/validateCreateDiaAula.js.js';
// import { validateUpdateDiaAula } from '../middlewares/diaAula/validateUpdateDiaAula.js.js';

const router = express.Router();

// GET /api/diaAulas - Buscar todos os diaAulas
router.get('/', validateSearchQuery, GetDiaAulaListController.handle);

// GET /api/diaAulas/:id - Buscar diaAula por ID
router.get('/:id', validateId, GetDiaAulaController.handle);

// POST /api/diaAulas - Criar novo diaAula
router.post('/', validateCreateDiaAula, CreateDiaAulaController.handle);

// PUT /api/diaAulas/:id - Atualizar diaAula por ID
// router.put('/:id', validateId, validateUpdateDiaAula, UpdateDiaAulaController.handle);

// DELETE /api/diaAulas/:id - Deletar diaAula por ID
router.delete('/:id', validateId, DeleteDiaAulaController.handle);

export default router;
