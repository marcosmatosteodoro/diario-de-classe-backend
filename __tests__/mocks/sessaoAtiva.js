import { jest } from '@jest/globals';
import SessaoLoginRepository from '../../src/repositories/sessaoLoginRepository.js';
import { sidDe } from './accessDeTeste.js';

// Dublê único das suítes que passam pelo `isLoggedIn` (DEC-005-022): espiona `lerEstado` e devolve o
// formato real declarado no repository. Não implementa o SQL; o SQL é provado na suíte do repository.
const estado = (idUsuario, sobre = {}) => ({
  idUsuario,
  jtiAtual: 'jti-atual-de-teste',
  jtiAnterior: null,
  encerrada: false,
  ativa: true,
  dentroDaTolerancia: true,
  expiraEmEpoch: Math.floor(Date.now() / 1000) + 3600,
  restanteSegundos: 3600,
  ...sobre
});

const espiar = resultado =>
  jest.spyOn(SessaoLoginRepository.prototype, 'lerEstado').mockResolvedValue(resultado);

// Vários donos: cada `sid` (convenção `sidDe`) pertence ao seu usuário; sid desconhecido cai no primeiro.
export const sessaoAtiva = (...idsUsuario) =>
  jest
    .spyOn(SessaoLoginRepository.prototype, 'lerEstado')
    .mockImplementation(async sid =>
      estado(idsUsuario.find(id => sid === sidDe(id)) ?? idsUsuario[0])
    );

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
