import express from 'express';
import { createUser } from '../controllers/usersController.js';
import { GetUserListController } from '../controllers/user/getUserListController.js';
import { GetUserController } from '../controllers/user/getUserController.js';

const router = express.Router();

// GET /api/users - Buscar todos os usuários
router.get('/', GetUserListController.handle);

// GET /api/users/:id - Buscar usuário por ID
router.get('/:id', GetUserController.handle);

// POST /api/users - Criar novo usuário
router.post('/', createUser);

export default router;
