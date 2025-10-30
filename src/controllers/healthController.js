/**
 * Controller para endpoints de saúde da API
 */

/**
 * Health check da API
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const healthCheck = (req, res) => {
  res.status(200).json({
    status: req.t('api.health.status'),
    message: req.t('api.health.message'),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    language: req.language || 'pt' // Idioma detectado
  });
};

/**
 * Endpoint de boas-vindas da API
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const welcome = (req, res) => {
  res.status(200).json({
    message: req.t('api.welcome'),
    version: '1.0.0',
    language: req.language || 'pt',
    endpoints: {
      health: '/api/health',
      users: '/api/users'
    }
  });
};
