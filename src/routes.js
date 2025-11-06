import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';
import userRoutes from './routes/userRouter.js';
import alunoRouters from './routes/alunoRouter.js';

const userController = userRoutes;
const alunoController = alunoRouters;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/professores', userController);
router.use('/alunos', alunoController);

export default router;
