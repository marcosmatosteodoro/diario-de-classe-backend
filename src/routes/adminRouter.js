import express from 'express';
// Controladores
import { UpdateNomeCompletoController } from '../controllers/admin/updateNomeCompletoController.js';

const router = express.Router();

// POST /api/admin
router.post('/update-nomeCompleto', UpdateNomeCompletoController.handle);

export default router;
