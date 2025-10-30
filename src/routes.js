import express from 'express';

const router = express.Router();

// Rota para verificar se a API está funcionando
router.get('/health', (req, res) => {
  res.status(200).json({
    status: req.t('api.health.status'),
    message: req.t('api.health.message'),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    language: req.language || 'pt' // Idioma detectado
  });
});

// Rota raiz da API
router.get('/', (req, res) => {
  res.status(200).json({
    message: req.t('api.welcome'),
    version: '1.0.0',
    language: req.language || 'pt',
    endpoints: {
      health: '/api/health'
    }
  });
});

export default router;
