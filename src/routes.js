import express from 'express';
// Rotas
import authRouter from './routes/authRouter.js';
import userRoutes from './routes/userRouter.js';
import alunoRouters from './routes/alunoRouter.js';
import configuracaoRouter from './routes/configuracaoRouter.js';
import contratoRouter from './routes/contratoRouter.js';
import diaAulaRouter from './routes/diaAulaRouter.js';
import aulaRouter from './routes/aulaRouter.js';
import dashboardRouter from './routes/dashboardRouter.js';
import relatoriosRouter from './routes/relatoriosRouter.js';
import adminRouter from './routes/adminRouter.js';
// Controladores
import { healthCheck, welcome } from './controllers/healthController.js';
// Middlewares de validação
import isLoggedIn from './middlewares/auth/isLoggedIn.js';
import adminOnly from './middlewares/adminOnly.js';

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/auth', authRouter);
router.use('/dashboard', isLoggedIn, dashboardRouter);
router.use('/professores', isLoggedIn, adminOnly, userRoutes);
router.use('/alunos', isLoggedIn, alunoRouters);
router.use('/configuracao', isLoggedIn, configuracaoRouter);
router.use('/contratos', isLoggedIn, contratoRouter);
router.use('/dias-aulas', isLoggedIn, diaAulaRouter);
router.use('/aulas', isLoggedIn, aulaRouter);
router.use('/relatorios', isLoggedIn, adminOnly, relatoriosRouter);
router.use('/admin', isLoggedIn, adminOnly, adminRouter);

export default router;
