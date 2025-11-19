import express from 'express';
// Controladores
import { GetContratoListController } from '../controllers/contrato/getContratoListController.js';
// import { GetContratoController } from '../controllers/contrato/getContratoController.js';
// import { DeleteContratoController } from '../controllers/contrato/deleteContratoController.js';
// import { CreateContratoController } from '../controllers/contrato/createContratoController.js';
// import { UpdateContratoController } from '../controllers/contrato/updateContratoController.js';
// Middlewares de validação
// import { validateId } from '../middlewares/validateId.js';
// import { validateCreateContrato } from '../middlewares/contrato/validateCreateContrato.js';
// import { validateUpdateContrato } from '../middlewares/contrato/validateUpdateContrato.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';

const router = express.Router();

// GET /api/contratos - Buscar todos os contratos
router.get('/', validateSearchQuery, GetContratoListController.handle);

// // GET /api/contratos/:id - Buscar contrato por ID
// router.get('/:id', validateId, GetContratoController.handle);

// // POST /api/contratos - Criar novo contrato
// router.post('/', validateCreateContrato, CreateContratoController.handle);

// // PUT /api/contratos/:id - Atualizar contrato por ID
// router.put('/:id', validateId, validateUpdateContrato, UpdateContratoController.handle);

// // DELETE /api/contratos/:id - Deletar contrato por ID
// router.delete('/:id', validateId, DeleteContratoController.handle);

export default router;
