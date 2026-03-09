import express from 'express';
// Controladores
import { GetRelatoriosController } from '../controllers/relatorios/getRelatoriosController.js';
import { GetRelatorio1Controller } from '../controllers/relatorios/getRelatorio1Controller.js';
// Middlewares de validação
import { validateRelatorio1 } from '../middlewares/relatorios/validateRelatorio1.js';

const router = express.Router();

// GET /api/relatorios - Buscar todos os relatorios
router.get('/', GetRelatoriosController.handle);

// GET /api/relatorios/relatorio-1 - Traz o relatorio 1
router.get('/relatorio-1', validateRelatorio1, GetRelatorio1Controller.handle);

export default router;
