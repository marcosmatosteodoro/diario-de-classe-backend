import LoggerManager from './loggerManager.js';

// Meta fechado com só ids e ação: e-mail, IP ou corpo no log de recusa seria PII sem necessidade (DEC-002-005 · demonstracao).
export const registrarRecusaDemo = (req, { acao, contaAlvoId } = {}) => {
  LoggerManager.warn('demo.acao_recusada', {
    acao,
    contaSolicitanteId: req.user?.sub ?? null,
    contaAlvoId: contaAlvoId ?? null
  });
};
