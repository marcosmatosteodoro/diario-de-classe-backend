import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';
import authRouter from './routes/authRouter.js';
import userRoutes from './routes/userRouter.js';
import alunoRouters from './routes/alunoRouter.js';
import configuracaoRouter from './routes/configuracaoRouter.js';
import contratoRouter from './routes/contratoRouter.js';
import diaAulaRouter from './routes/diaAulaRouter.js';

const authController = authRouter;
const userController = userRoutes;
const alunoController = alunoRouters;
const configuracaoController = configuracaoRouter;
const contratoController = contratoRouter;
const diaAulaController = diaAulaRouter;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/auth', authController);
router.use('/professores', userController);
router.use('/alunos', alunoController);
router.use('/configuracao', configuracaoController);
router.use('/contratos', contratoController);
router.use('/dias-aulas', diaAulaController);

export default router;
