import Constants from '../../src/utilities/constants.js';
import { createJwt } from '../../src/utilities/createJwt.js';

// Ids no formato CUID exigido por `validateId`: "c" + 24 caracteres.
export const cuid = nome => `c${nome.padEnd(24, '0')}`;

// Sessão própria de cada usuário de teste; o dublê `sessaoAtiva` a reconhece por esta convenção.
export const sidDe = id => `sid-de-${id}`;

/**
 * Access de teste com as claims vigentes (`ver`, `sid`, `jti`), assinado com `segredo`.
 * Devolve só o JWT; quem precisa do cabeçalho monta `Bearer ${...}`.
 */
export const tokenDe = ({ id, role, sid = sidDe(id), ...extras }, segredo = Constants.jwtSecret) =>
  createJwt(
    {
      sub: id,
      id,
      email: 'usuario@example.com',
      role,
      ver: Constants.accessTokenVersion,
      sid,
      jti: `jti-${sid}`,
      ...extras
    },
    segredo
  );
