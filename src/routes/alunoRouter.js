import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
// Controladores
import { GetAlunoListController } from '../controllers/aluno/getAlunoListController.js';
import { GetAlunoController } from '../controllers/aluno/getAlunoController.js';
import { DeleteAlunoController } from '../controllers/aluno/deleteAlunoController.js';
import { CreateAlunoController } from '../controllers/aluno/createAlunoController.js';
import { UpdateAlunoController } from '../controllers/aluno/updateAlunoController.js';
import { GetDiaAulaListByAlunoController } from '../controllers/diaAula/getDiaAulaListByAlunoController.js';
import { GetContratoByAlunoController } from '../controllers/contrato/getContratoByAlunoController.js';
import { GetAulasByAlunoController } from '../controllers/aula/getAulasByAlunoController.js';
import { GetContratosByAlunoController } from '../controllers/contrato/getContratosByAlunoController.js';
import { UploadAlunoExcelController } from '../controllers/aluno/uploadAlunoExcelController.js';
import { CreateCronogramaController } from '../controllers/cronograma/createCronogramaController.js';
import { GetProjecaoCronogramaController } from '../controllers/cronograma/getProjecaoCronogramaController.js';
import { GetProjecaoCronogramaExcelController } from '../controllers/cronograma/getProjecaoCronogramaExcelController.js';
import { GetCronogramaListByAlunoController } from '../controllers/cronograma/getCronogramaListByAlunoController.js';
// Middlewares de validação
import { validateId } from '../middlewares/validateId.js';
import { validateCreateAluno } from '../middlewares/aluno/validateCreateAluno.js';
import { validateUpdateAluno } from '../middlewares/aluno/validateUpdateAluno.js';
import { validateSearchQuery } from '../middlewares/validateSearchQuery.js';
import { validateExcelFile } from '../middlewares/validateExcelFile.js';
import { validateCreateCronograma } from '../middlewares/cronograma/validateCreateCronograma.js';

const router = express.Router();

// Usa /tmp tanto em produção quanto local
const uploadDir = path.join(os.tmpdir(), 'uploads');

const upload = multer({ dest: uploadDir });

// GET /api/alunos - Buscar todos os alunos
router.get('/', validateSearchQuery, GetAlunoListController.handle);

// GET /api/alunos/:id - Buscar aluno por ID
router.get('/:id', validateId, GetAlunoController.handle);

// POST /api/alunos - Criar novo aluno
router.post('/', validateCreateAluno, CreateAlunoController.handle);

// PUT /api/alunos/:id - Atualizar aluno por ID
router.put('/:id', validateId, validateUpdateAluno, UpdateAlunoController.handle);

// DELETE /api/alunos/:id - Deletar aluno por ID
router.delete('/:id', validateId, DeleteAlunoController.handle);

// GET /api/alunos/:id/dias-aulas - Buscar dias de aulas de um aluno
router.get('/:id/dias-aulas', validateId, GetDiaAulaListByAlunoController.handle);

// GET /api/alunos/:id/contrato - Buscar contrato ativo ou pendente de um aluno
router.get('/:id/contrato', validateId, GetContratoByAlunoController.handle);

// GET /api/alunos/:id/contrato - Buscar contrato ativo ou pendente de um aluno
router.get('/:id/contratos', validateId, GetContratosByAlunoController.handle);

// GET /api/alunos/:id/aulas - Buscar todas as aulas do aluno pelo ID
router.get('/:id/aulas', validateId, GetAulasByAlunoController.handle);

// POST /api/alunos/upload - Gerar alunos de acordo com lista de excel
router.post('/upload', upload.single('file'), validateExcelFile, UploadAlunoExcelController.handle);

// GET /api/alunos/:id/cronograma - Cronograma do livro em curso (a "planilha")
router.get('/:id/cronograma', validateId, GetProjecaoCronogramaController.handle);

// GET /api/alunos/:id/cronograma/excel - Baixar o cronograma em xlsx
router.get('/:id/cronograma/excel', validateId, GetProjecaoCronogramaExcelController.handle);

// POST /api/alunos/:id/cronograma - Matricular o aluno em um livro
router.post(
  '/:id/cronograma',
  validateId,
  validateCreateCronograma,
  CreateCronogramaController.handle
);

// GET /api/alunos/:id/cronogramas - Histórico de livros do aluno
router.get('/:id/cronogramas', validateId, GetCronogramaListByAlunoController.handle);

export default router;
