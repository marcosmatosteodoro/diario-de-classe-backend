/**
 * Controller para endpoints de saúde da API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

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
    version: packageJson.version,
    message: req.t('api.welcome'),
    status: req.t('api.health.status'),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    language: req.language || 'pt'
  });
};
