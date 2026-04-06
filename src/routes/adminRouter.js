import express from 'express';
// Controladores
import { UpdateNomeCompletoController } from '../controllers/admin/updateNomeCompletoController.js';

const router = express.Router();

// GET /api/admin
router.get('/update-nomeCompleto', UpdateNomeCompletoController.handle);

export default router;
