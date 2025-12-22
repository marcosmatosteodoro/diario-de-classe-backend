import express from 'express';
// Controladores
import { GetDisponibilidadeProfessorController } from '../controllers/disponibilidade/getDisponibilidadeProfessorController.js';
import { UpdateDisponibilidadeProfessorController } from '../controllers/disponibilidade/updateDisponibilidadeProfessorController.js';
// Middlewares de validação
import { validateUpdateDisponibilidadeProfessor } from '../middlewares/disponibilidade/validateUpdateDisponibilidadeProfessor.js';

const router = express.Router();

// GET /api/professores/:id/disponibilidadeProfessor - Buscar todos os disponibilidades de professor
router.get('/', GetDisponibilidadeProfessorController.handle);

// PUT /api/professores/:id/disponibilidadeProfessor/:id - Atualizar disponibilidade de professor por ID
router.put(
  '/',
  validateUpdateDisponibilidadeProfessor,
  UpdateDisponibilidadeProfessorController.handle
);

export default router;
