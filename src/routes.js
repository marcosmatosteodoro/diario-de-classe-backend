import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';
import authRouter from './routes/authRouter.js';
import userRoutes from './routes/userRouter.js';
import alunoRouters from './routes/alunoRouter.js';
import configuracaoRouter from './routes/configuracaoRouter.js';
import contratoRouter from './routes/contratoRouter.js';

const authController = authRouter;
const userController = userRoutes;
const alunoController = alunoRouters;
const configuracaoController = configuracaoRouter;
const contratoController = contratoRouter;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/auth', authController);
router.use('/professores', userController);
router.use('/alunos', alunoController);
router.use('/configuracao', configuracaoController);
router.use('/contratos', contratoController);

export default router;
