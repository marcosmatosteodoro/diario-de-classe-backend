import express from 'express';
// Controladores
import { LoginController } from '../controllers/auth/loginController.js';
import { LogoutController } from '../controllers/auth/logoutController.js';
import { RefreshTokenController } from '../controllers/auth/refreshTokenController.js';
// Middlewares de validação
import { validateLoginParams } from '../middlewares/auth/validateLoginParams.js';
import { limitLoginAttempts } from '../middlewares/auth/limitLoginAttempts.js';
import requireSameOrigin from '../middlewares/auth/requireSameOrigin.js';

const router = express.Router();

// POST /auth/login
router.post('/login', validateLoginParams, limitLoginAttempts, LoginController.handle);

// POST /auth/logout
router.post('/logout', requireSameOrigin, LogoutController.handle);

// POST /auth/refresh-token
router.post('/refresh-token', requireSameOrigin, RefreshTokenController.handle);

export default router;
