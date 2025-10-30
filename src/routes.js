import express from 'express';

const router = express.Router();

// Rota para verificar se a API está funcionando
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API está funcionando corretamente!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota raiz da API
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bem-vindo à API do Diário de Classe!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health'
    }
  });
});

export default router;
