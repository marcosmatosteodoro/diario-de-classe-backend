import express from 'express';
// Controladores
import { LoginController } from '../controllers/auth/loginController.js';
import { LogoutController } from '../controllers/auth/logoutController.js';
import { RefreshTokenController } from '../controllers/auth/refreshTokenController.js';
// Middlewares de validação
import { validateLoginParams } from '../middlewares/auth/validateLoginParams.js';
import { validateRefreshTokenParams } from '../middlewares/auth/validateRefreshTokenParams.js';

const router = express.Router();

// POST /auth/login
router.post('/login', validateLoginParams, LoginController.handle);

// POST /auth/logout
router.post('/logout', validateRefreshTokenParams, LogoutController.handle);

// POST /auth/refresh-token
router.post('/refresh-token', validateRefreshTokenParams, RefreshTokenController.handle);

export default router;
