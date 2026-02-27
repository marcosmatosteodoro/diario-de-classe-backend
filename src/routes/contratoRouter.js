import express from 'express';
// Controladores
import { GetContratoListController } from '../controllers/contrato/getContratoListController.js';
import { GetContratoController } from '../controllers/contrato/getContratoController.js';
import { DeleteContratoController } from '../controllers/contrato/deleteContratoController.js';
import { CreateContratoController } from '../controllers/contrato/createContratoController.js';
import { UpdateContratoController } from '../controllers/contrato/updateContratoController.js';
import { GetDiaAulaListByContratoController } from '../controllers/diaAula/getDiaAulaListByContratoController.js';
import { CreateManyDiaAulaController } from '../controllers/diaAula/createManyDiaAulaController.js';
import { GenerateAulasByContratoController } from '../controllers/aula/generateAulasByContratoController.js';
import { GetAulasByContratoController } from '../controllers/aula/getAulasByContratoController.js';
import { CreateManyAulaController } from '../controllers/aula/createManyAulaController.js';
import { ValidateContratoController } from '../controllers/contrato/validateContratoController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateCreateContrato } from '../middlewares/contrato/validateCreateContrato.js';
import { validateUpdateContrato } from '../middlewares/contrato/validateUpdateContrato.js';
import { validateCreateManyDiaAula } from '../middlewares/diaAula/validateCreateManyDiaAula.js';
import { validateCreateManyAula } from '../middlewares/aula/validateCreateManyAula.js';
import { validateGenerateAula } from '../middlewares/aula/validateGenerateAula.js';
import adminOnly from '../middlewares/adminOnly.js';

const router = express.Router();

// GET /api/contratos - Buscar todos os contratos
router.get('/', GetContratoListController.handle);

// GET /api/contratos/:id - Buscar contrato por ID
router.get('/:id', validateId, GetContratoController.handle);

// POST /api/contratos - Criar novo contrato
router.post('/', adminOnly, validateCreateContrato, CreateContratoController.handle);

// PUT /api/contratos/:id - Atualizar contrato por ID
router.put('/:id', adminOnly, validateId, validateUpdateContrato, UpdateContratoController.handle);

// DELETE /api/contratos/:id - Deletar contrato por ID
router.delete('/:id', adminOnly, validateId, DeleteContratoController.handle);

// GET /api/contratos/:id/dias-aulas - Buscar dias de aulas de um contrato
router.get('/:id/dias-aulas', validateId, GetDiaAulaListByContratoController.handle);

// POST /api/contratos/:id/dia-aulas - Criar novos dias de aulas
router.post(
  '/:id/dias-aulas',
  adminOnly,
  validateId,
  validateCreateManyDiaAula,
  CreateManyDiaAulaController.handle
);

// GET /api/contratos/:id/aulas - Buscar aulas de um contrato
router.get('/:id/aulas', validateId, GetAulasByContratoController.handle);

// POST /api/contratos/:id/aulas - Criar aulas de um contrato
router.post(
  '/:id/aulas',
  adminOnly,
  validateId,
  validateCreateManyAula,
  CreateManyAulaController.handle
);

// POST /api/contratos/aulas/generate - Buscar aulas de um contrato

router.post(
  '/aulas/generate',
  adminOnly,
  validateGenerateAula,
  GenerateAulasByContratoController.handle
);

// GET /api/contratos/:id/validate - Faz a validação do contrato
router.get('/:id/validate', adminOnly, validateId, ValidateContratoController.handle);

export default router;
