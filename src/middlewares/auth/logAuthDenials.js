import LoggerManager from '../../utilities/loggerManager.js';
import { rotaSemQuery } from '../../utilities/rotaSemQuery.js';
import { getLoginClientIp } from '../../utilities/loginAttemptKeys.js';

const STATUS_DE_NEGACAO = [401, 403];

/**
 * Registra uma linha por resposta 401/403, observando o status ao fim da resposta.
 * Rota sem query string: a query pode carregar dado pessoal (busca).
 */
export default function logAuthDenials(req, res, next) {
  res.on('finish', () => {
    // A resposta já saiu: o log é observação, não decide acesso; falhar aqui não pode derrubar o processo.
    try {
      if (!STATUS_DE_NEGACAO.includes(res.statusCode)) return;
      LoggerManager.warn('auth.acesso_negado', {
        status: res.statusCode,
        metodo: req.method,
        rota: rotaSemQuery(req),
        userId: req.user?.id ?? null,
        ip: getLoginClientIp(req)
      });
    } catch {
      // ver comentário acima
    }
  });
  next();
}
