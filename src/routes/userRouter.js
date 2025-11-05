import express from 'express';
import { GetUserListController } from '../controllers/user/getUserListController.js';
import { GetUserController } from '../controllers/user/getUserController.js';
import { DeleteUserController } from '../controllers/user/deleteUserController.js';
import { CreateUserController } from '../controllers/user/createUserController.js';
import { UpdateUserController } from '../controllers/user/updateUserController.js';
import { validateId } from '../middlewares/validateId.js';
import { validateCreateUser } from '../middlewares/validateCreateUser.js';
import { validateUpdateUser } from '../middlewares/validateUpdateUser.js';

const router = express.Router();

// GET /api/professores - Buscar todos os professores
router.get('/', GetUserListController.handle);

// GET /api/professores/:id - Buscar professor por ID
router.get('/:id', validateId, GetUserController.handle);

// POST /api/professores - Criar novo professor
router.post('/', validateCreateUser, CreateUserController.handle);

// PUT /api/professores/:id - Atualizar professor por ID
router.put('/:id', validateId, validateUpdateUser, UpdateUserController.handle);

// DELETE /api/professores/:id - Deletar professor por ID
router.delete('/:id', validateId, DeleteUserController.handle);

export default router;
