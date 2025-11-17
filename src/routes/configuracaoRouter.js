import express from 'express';
// Controladores
import { GetConfiguracaoController } from '../controllers/configuracao/getConfiguracaoController.js';
import { UpdateConfiguracaoController } from '../controllers/configuracao/updateConfiguracaoController.js';
// Middlewares de validação
import { validateUpdateConfiguracao } from '../middlewares/configuracao/validateUpdateConfiguracao.js';

const router = express.Router();

// GET /api/configuracaos - Buscar todos os configuracaos
router.get('/', GetConfiguracaoController.handle);

// PUT /api/configuracaos/:id - Atualizar configuracao por ID
router.put('/', validateUpdateConfiguracao, UpdateConfiguracaoController.handle);

export default router;
