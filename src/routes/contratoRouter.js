import express from 'express';
// Controladores
import { GetContratoListController } from '../controllers/contrato/getContratoListController.js';
import { GetContratoController } from '../controllers/contrato/getContratoController.js';
import { DeleteContratoController } from '../controllers/contrato/deleteContratoController.js';
import { CreateContratoController } from '../controllers/contrato/createContratoController.js';
import { UpdateContratoController } from '../controllers/contrato/updateContratoController.js';
import { GetDiaAulaListByContratoController } from '../controllers/diaAula/getDiaAulaListByContratoController.js';
import { CreateManyDiaAulaController } from '../controllers/diaAula/createManyDiaAulaController.js';
// Middlewares de validação
import { GetAulasByContratoController } from '../controllers/aula/getAulasByContratoController.js';
import { validateId } from '../middlewares/validateId.js';
import { validateCreateContrato } from '../middlewares/contrato/validateCreateContrato.js';
import { validateUpdateContrato } from '../middlewares/contrato/validateUpdateContrato.js';
import { validateCreateManyDiaAula } from '../middlewares/diaAula/validateCreateManyDiaAula.js';
import { CreateManyAulaController } from '../controllers/aula/createManyAulaController.js';
import { validateCreateManyAula } from '../middlewares/aula/validateCreateManyAula.js';

const router = express.Router();

// GET /api/contratos - Buscar todos os contratos
router.get('/', GetContratoListController.handle);

// GET /api/contratos/:id - Buscar contrato por ID
router.get('/:id', validateId, GetContratoController.handle);

// POST /api/contratos - Criar novo contrato
router.post('/', validateCreateContrato, CreateContratoController.handle);

// PUT /api/contratos/:id - Atualizar contrato por ID
router.put('/:id', validateId, validateUpdateContrato, UpdateContratoController.handle);

// DELETE /api/contratos/:id - Deletar contrato por ID
router.delete('/:id', validateId, DeleteContratoController.handle);

// GET /api/contratos/:id/dias-aulas - Buscar dias de aulas de um contrato
router.get('/:id/dias-aulas', validateId, GetDiaAulaListByContratoController.handle);

// POST /api/contratos/:id/dia-aulas - Criar novos dias de aulas
router.post(
  '/:id/dias-aulas',
  validateId,
  validateCreateManyDiaAula,
  CreateManyDiaAulaController.handle
);

// GET /api/contratos/:id/aulas - Buscar aulas de um contrato
router.get('/:id/aulas', validateId, GetAulasByContratoController.handle);

// POST /api/contratos/:id/aulas - Criar aulas de um contrato
router.post('/:id/aulas', validateId, validateCreateManyAula, CreateManyAulaController.handle);

export default router;
