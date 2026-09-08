import express from 'express';
// Controladores
import { UpdateConteudoLivroController } from '../controllers/conteudoLivro/updateConteudoLivroController.js';
import { DeleteConteudoLivroController } from '../controllers/conteudoLivro/deleteConteudoLivroController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateUpdateConteudoLivro } from '../middlewares/conteudoLivro/validateUpdateConteudoLivro.js';

const router = express.Router();

// PUT /api/conteudos/:id - Atualizar conteúdo por ID
router.put('/:id', validateId, validateUpdateConteudoLivro, UpdateConteudoLivroController.handle);

// DELETE /api/conteudos/:id - Deletar conteúdo por ID
router.delete('/:id', validateId, DeleteConteudoLivroController.handle);

export default router;
