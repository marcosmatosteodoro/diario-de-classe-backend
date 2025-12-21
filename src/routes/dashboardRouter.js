import express from 'express';

// Controladores
import { GetHomeController } from '../controllers/dashboard/getHome.js';

const router = express.Router();

// GET /api/dashboard - Buscar todos os professores
router.get('/', GetHomeController.handle);

export default router;
