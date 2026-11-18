// Formato de retorno de `lerEstado` (declarado no repository): ponto único para evoluir o contrato
// do registro nos testes (DEC-005-022).
export const estadoDeSessao = (idUsuario, sobre = {}) => ({
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
