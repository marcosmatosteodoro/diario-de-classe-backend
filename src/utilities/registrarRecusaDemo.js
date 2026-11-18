import LoggerManager from './loggerManager.js';

// Meta fechado: só ids e a ação; nada de e-mail, IP ou corpo (sem PII no log).
export const registrarRecusaDemo = (req, { acao, contaAlvoId } = {}) => {
  LoggerManager.warn('demo.acao_recusada', {
    acao,
    contaSolicitanteId: req.user?.sub ?? null,
    contaAlvoId: contaAlvoId ?? null
  });
};
