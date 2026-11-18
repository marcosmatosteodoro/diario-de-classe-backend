import express from 'express';
import bloquearEmModoDemo from '../middlewares/bloquearEmModoDemo.js';
// Controladores
import { UpdateNomeCompletoController } from '../controllers/admin/updateNomeCompletoController.js';

const router = express.Router();

// POST /api/admin
router.post(
  '/update-nomeCompleto',
  bloquearEmModoDemo('atualizacao_lote_nome_completo'),
  UpdateNomeCompletoController.handle
);

export default router;
