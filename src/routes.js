import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';
import userRoutes from './routes/userRouter.js';
import alunoRouters from './routes/alunoRouter.js';
import configuracaoRouter from './routes/configuracaoRouter.js';

const userController = userRoutes;
const alunoController = alunoRouters;
const configuracaoController = configuracaoRouter;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/professores', userController);
router.use('/alunos', alunoController);
router.use('/configuracao', configuracaoController);

export default router;
