import express from 'express';
// Controladores
import { UpdateCronogramaController } from '../controllers/cronograma/updateCronogramaController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateUpdateCronograma } from '../middlewares/cronograma/validateUpdateCronograma.js';

const router = express.Router();

// PUT /api/cronogramas/:id - Atualizar cronograma por ID
router.put('/:id', validateId, validateUpdateCronograma, UpdateCronogramaController.handle);

export default router;
