import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
// Controladores
import { GetLivroListController } from '../controllers/livro/getLivroListController.js';
import { GetLivroController } from '../controllers/livro/getLivroController.js';
import { CreateLivroController } from '../controllers/livro/createLivroController.js';
import { UpdateLivroController } from '../controllers/livro/updateLivroController.js';
import { DeleteLivroController } from '../controllers/livro/deleteLivroController.js';
import { GetConteudoLivroListByLivroController } from '../controllers/conteudoLivro/getConteudoLivroListByLivroController.js';
import { CreateConteudoLivroController } from '../controllers/conteudoLivro/createConteudoLivroController.js';
import { UploadConteudoLivroExcelController } from '../controllers/conteudoLivro/uploadConteudoLivroExcelController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';
import { validateExcelFile } from '../middlewares/validateExcelFile.js';
import { validateCreateLivro } from '../middlewares/livro/validateCreateLivro.js';
import { validateUpdateLivro } from '../middlewares/livro/validateUpdateLivro.js';
import { validateCreateConteudoLivro } from '../middlewares/conteudoLivro/validateCreateConteudoLivro.js';
import adminOnly from '../middlewares/adminOnly.js';

const router = express.Router();

// Usa /tmp tanto em produção quanto local
const uploadDir = path.join(os.tmpdir(), 'uploads');

const upload = multer({ dest: uploadDir });

// GET /api/livros - Buscar todos os livros
router.get('/', validateSearchQuery, GetLivroListController.handle);

// GET /api/livros/:id - Buscar livro por ID (com os conteúdos)
router.get('/:id', validateId, GetLivroController.handle);

// POST /api/livros - Criar novo livro
router.post('/', adminOnly, validateCreateLivro, CreateLivroController.handle);

// PUT /api/livros/:id - Atualizar livro por ID
router.put('/:id', adminOnly, validateId, validateUpdateLivro, UpdateLivroController.handle);

// DELETE /api/livros/:id - Deletar livro por ID
router.delete('/:id', adminOnly, validateId, DeleteLivroController.handle);

// GET /api/livros/:id/conteudos - Buscar conteúdos de um livro
router.get('/:id/conteudos', validateId, GetConteudoLivroListByLivroController.handle);

// POST /api/livros/:id/conteudos - Criar conteúdo em um livro
router.post(
  '/:id/conteudos',
  adminOnly,
  validateId,
  validateCreateConteudoLivro,
  CreateConteudoLivroController.handle
);

// POST /api/livros/:id/conteudos/upload - Substituir conteúdos do livro por planilha
router.post(
  '/:id/conteudos/upload',
  adminOnly,
  validateId,
  upload.single('file'),
  validateExcelFile,
  UploadConteudoLivroExcelController.handle
);

export default router;
