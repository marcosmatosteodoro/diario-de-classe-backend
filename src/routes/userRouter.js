import express from 'express';
import { GetUserListController } from '../controllers/user/getUserListController.js';
import { GetUserController } from '../controllers/user/getUserController.js';
import { DeleteUserController } from '../controllers/user/deleteUserController.js';
import { validateId } from '../middlewares/validateId.js';
import { validateCreateUser } from '../middlewares/validateCreateUser.js';
import { CreateUserController } from '../controllers/user/createUserController.js';

const router = express.Router();

// GET /api/users - Buscar todos os usuários
router.get('/', GetUserListController.handle);

// GET /api/users/:id - Buscar usuário por ID
router.get('/:id', validateId, GetUserController.handle);

// POST /api/users - Criar novo usuário
router.post('/', validateCreateUser, CreateUserController.handle);

// DELETE /api/users/:id - Deletar usuário por ID
router.delete('/:id', validateId, DeleteUserController.handle);

export default router;
