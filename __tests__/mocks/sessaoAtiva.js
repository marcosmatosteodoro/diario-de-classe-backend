import { jest } from '@jest/globals';
import SessaoLoginRepository from '../../src/repositories/sessaoLoginRepository.js';
import { sidDe } from './accessDeTeste.js';
import { estadoDeSessao as estado } from './estadoDeSessao.js';

// Dublê único das suítes que passam pelo `isLoggedIn` (DEC-005-022): espiona `lerEstado` e devolve o
// formato real declarado no repository. Não implementa o SQL; o SQL é provado na suíte do repository.
const espiar = resultado =>
  jest.spyOn(SessaoLoginRepository.prototype, 'lerEstado').mockResolvedValue(resultado);

// Vários donos: cada `sid` (convenção `sidDe`) pertence ao seu usuário; sid fora da convenção `sidDe` devolve `null`.
export const sessaoAtiva = (...idsUsuario) =>
  jest.spyOn(SessaoLoginRepository.prototype, 'lerEstado').mockImplementation(async sid => {
    const dono = idsUsuario.find(id => sid === sidDe(id));
    return dono === undefined ? null : estado(dono);
  });

export const sessaoEncerrada = (idUsuario = 'dono-da-sessao') =>
  espiar(estado(idUsuario, { encerrada: true, ativa: false }));

export const sessaoVencida = (idUsuario = 'dono-da-sessao') =>
  espiar(estado(idUsuario, { ativa: false, expiraEmEpoch: 1, restanteSegundos: 0 }));

export const sessaoDeOutroUsuario = () => espiar(estado('outro-usuario-de-teste'));

// O erro do ORM embute argumentos da consulta na `message`; o sentinela permite provar que ela não vaza.
export const sessaoIndisponivel = (mensagem = 'registro indisponível') => {
  const erro = new Error(mensagem);
  erro.name = 'PrismaClientKnownRequestError';
  erro.code = 'P1001';
  return jest.spyOn(SessaoLoginRepository.prototype, 'lerEstado').mockRejectedValue(erro);
};
