import express from 'express';
import { healthCheck, welcome } from './controllers/healthController.js';
import userRoutes from './routes/userRouter.js';

const userController = userRoutes;

const router = express.Router();

router.get('/', welcome);
router.get('/health', healthCheck);
router.use('/professores', userController);

export default router;
