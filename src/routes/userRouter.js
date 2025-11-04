import express from 'express';
import { createUser } from '../controllers/usersController.js';
import { GetUserListController } from '../controllers/user/getUserListController.js';

const router = express.Router();

// GET /api/users - Buscar todos os usuários
router.get('/', GetUserListController.handle);

// POST /api/users - Criar novo usuário
router.post('/', createUser);

export default router;
