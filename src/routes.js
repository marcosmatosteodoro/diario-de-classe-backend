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
// Controladores
import { healthCheck, welcome } from './controllers/healthController.js';
// Middlewares de validação
import isLoggedIn from './middlewares/auth/isLoggedIn.js';

const authController = authRouter;
const userController = userRoutes;
const alunoController = alunoRouters;
const configuracaoController = configuracaoRouter;
const contratoController = contratoRouter;
const diaAulaController = diaAulaRouter;
const aulaController = aulaRouter;
const dashboardController = dashboardRouter;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/auth', authController);
router.use('/dashboard', isLoggedIn, dashboardController);
router.use('/professores', isLoggedIn, userController);
router.use('/alunos', isLoggedIn, alunoController);
router.use('/configuracao', isLoggedIn, configuracaoController);
router.use('/contratos', isLoggedIn, contratoController);
router.use('/dias-aulas', isLoggedIn, diaAulaController);
router.use('/aulas', isLoggedIn, aulaController);

export default router;
