import express from 'express';
import { listUsers, createUser } from '../controllers/usersController.js';

const router = express.Router();

// GET /api/users - Buscar todos os usuários
router.get('/', listUsers);

// POST /api/users - Criar novo usuário
router.post('/', createUser);

export default router;
