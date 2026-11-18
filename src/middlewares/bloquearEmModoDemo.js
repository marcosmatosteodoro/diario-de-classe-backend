import Constants from '../utilities/constants.js';
import { registrarRecusaDemo } from '../utilities/registrarRecusaDemo.js';

/**
 * Fábrica de middleware que recusa a ação com 403 enquanto o modo demonstração está ligado
 * @param {string} acao - Nome da ação recusada, gravado no evento de recusa
 * @returns {Function} Middleware (req, res, next)
 */
export const bloquearEmModoDemo = acao => (req, res, next) => {
  // Flag lida a cada requisição, nunca copiada em constante de módulo: o teste a alterna em tempo de execução (DEC-002-003 · demonstracao).
  if (!Constants.demoMode) {
    return next();
  }
  // Sem try/catch: se o log lança, o erro propaga ao error-handler e a requisição não é liberada (DEC-002-009 · demonstracao).
  registrarRecusaDemo(req, { acao });
  return res.status(403).json({
    message: req.t('api.errors.demo_mode_blocked')
  });
};

export default bloquearEmModoDemo;
