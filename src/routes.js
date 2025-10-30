import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';

const router = express.Router();

// Rota para verificar se a API está funcionando
router.get('/health', healthCheck);

// Rota raiz da API
router.get('/', welcome);

export default router;
