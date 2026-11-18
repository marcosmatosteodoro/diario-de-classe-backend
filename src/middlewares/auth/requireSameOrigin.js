import Constants from '../../utilities/constants.js';

/**
 * Recusa (403) a requisição cuja origem não é do próprio app, antes de qualquer
 * leitura do cookie de sessão (DEC-003-017). `Origin` precisa ser igual, caractere a
 * caractere, a uma entrada de `Constants.corsOrigins`; `Sec-Fetch-Site`, quando
 * presente, precisa ser `same-origin`. Qualquer outra coisa nega.
 */
export default (req, res, next) => {
  try {
    const origem = req.get('Origin');
    const fetchSite = req.get('Sec-Fetch-Site');

    const origemListada = typeof origem === 'string' && Constants.corsOrigins.includes(origem);
    const mesmaOrigem = fetchSite === undefined || fetchSite === 'same-origin';

    if (origemListada && mesmaOrigem) {
      return next();
    }
  } catch {
    // fail secure: erro ao avaliar cai na recusa abaixo
  }

  return res.status(403).json({ message: req.t('api.errors.forbidden') });
};
