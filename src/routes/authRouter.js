import express from 'express';
import { LoginController } from '../controllers/auth/loginController.js';
// import { LogoutController } from '../controllers/auth/logoutController.js';
// import { RefreshTokenController } from '../controllers/auth/refreshTokenController.js';

const router = express.Router();

// POST /auth/login
router.post('/login', LoginController.handle);

// POST /auth/logout
// router.post('/logout', LogoutController.handle);

// POST /auth/refresh-token
// router.post('/refresh-token', RefreshTokenController.handle);

export default router;
