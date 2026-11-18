import prisma from '../db/prisma.js';
import Constants from '../utilities/constants.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository do registro de sessões de login (uma linha por login). As transições que decidem
 * corrida (rotacionar, substituir sucessor, encerrar) são escritas condicionais atômicas: zero
 * linhas afetadas é o sinal de que outro pedido chegou antes. O relógio é o do banco (`NOW()`).
 */
export default class SessaoLoginRepository extends AbstractRepository {
  getEntity() {
    return prisma.sessaoLogin;
  }

  /**
   * @returns {{ id: boolean, idUsuario: boolean, expiraEm: boolean, encerradaEm: boolean, motivoEncerramento: boolean }}
   */
  getSelectFields() {
    return {
      id: true,
      idUsuario: true,
      expiraEm: true,
      encerradaEm: true,
      motivoEncerramento: true
    };
  }

  /**
   * Cria a sessão do login; `rotacionadaEm` assume o instante da criação.
   * @param {{ idUsuario: string, jtiAtual: string, expiraEm: Date }} dados
   * @returns {Promise<{ id: string }>} o `sid` gerado
   */
  async criar({ idUsuario, jtiAtual, expiraEm }) {
    return await this.create({ idUsuario, jtiAtual, expiraEm }, { select: { id: true } });
  }

  /**
   * Lê o estado da sessão por PK (1 leitura); ativa = não encerrada e não vencida.
   * @param {string} sid
   * @returns {Promise<{
   *   idUsuario: string,
   *   jtiAtual: string,
   *   jtiAnterior: string|null,
   *   encerrada: boolean,
   *   ativa: boolean,
   *   dentroDaTolerancia: boolean,
   *   expiraEmEpoch: number,
   *   restanteSegundos: number
   * }|null>} `null` para sessão inexistente; `dentroDaTolerancia` vale para o `rotacionadaEm`
   *   da linha (limite inclusivo) e `restanteSegundos` já sai do relógio do banco
   */
  async lerEstado(sid) {
    const rows = await prisma.$queryRaw`
      SELECT "idUsuario", "jtiAtual", "jtiAnterior",
        ("encerradaEm" IS NOT NULL) AS "encerrada",
        ("encerradaEm" IS NULL AND "expiraEm" > NOW()) AS "ativa",
        (NOW() - "rotacionadaEm" <= (${Constants.sessionRotationGraceSeconds}::int * INTERVAL '1 second')) AS "dentroDaTolerancia",
        FLOOR(EXTRACT(EPOCH FROM "expiraEm"))::int AS "expiraEmEpoch",
        GREATEST(CEIL(EXTRACT(EPOCH FROM ("expiraEm" - NOW())))::int, 0) AS "restanteSegundos"
      FROM "sessoes_login"
      WHERE "id" = ${sid}`;
    return rows[0] ?? null;
  }

  /**
   * Rotaciona o refresh: só vence quem apresenta o `jtiAtual` de uma sessão ativa.
   * @param {string} sid
   * @param {string} apresentado - `jti` apresentado, que deve ser o `jtiAtual`
   * @param {string} novoJti
   * @returns {Promise<{ jtiAtual: string, jtiAnterior: string|null, expiraEmEpoch: number, restanteSegundos: number }|null>}
   *   a linha de `RETURNING`, ou `null` quando perdeu a corrida ou a sessão não está ativa
   */
  async rotacionar(sid, apresentado, novoJti) {
    const rows = await prisma.$queryRaw`
      UPDATE "sessoes_login"
      SET "jtiAnterior" = "jtiAtual", "jtiAtual" = ${novoJti}, "rotacionadaEm" = NOW(), "dataAtualizacao" = NOW()
      WHERE "id" = ${sid} AND "jtiAtual" = ${apresentado} AND "encerradaEm" IS NULL AND "expiraEm" > NOW()
      RETURNING "jtiAtual", "jtiAnterior", FLOOR(EXTRACT(EPOCH FROM "expiraEm"))::int AS "expiraEmEpoch", GREATEST(CEIL(EXTRACT(EPOCH FROM ("expiraEm" - NOW())))::int, 0) AS "restanteSegundos"`;
    return rows[0] ?? null;
  }

  /**
   * Troca o sucessor quando o `jti` apresentado é o anterior e o atual ainda é o que foi lido;
   * mantém `jtiAnterior`.
   * @param {string} sid
   * @param {string} apresentado - `jti` apresentado, que deve ser o `jtiAnterior`
   * @param {string} jtiAtualLido - `jtiAtual` lido por `lerEstado`
   * @param {string} novoJti
   * @returns {Promise<{ jtiAtual: string, jtiAnterior: string|null, expiraEmEpoch: number, restanteSegundos: number }|null>}
   *   a linha de `RETURNING`, ou `null` quando perdeu a corrida ou a sessão não está ativa
   */
  async substituirSucessor(sid, apresentado, jtiAtualLido, novoJti) {
    const rows = await prisma.$queryRaw`
      UPDATE "sessoes_login"
      SET "jtiAtual" = ${novoJti}, "rotacionadaEm" = NOW(), "dataAtualizacao" = NOW()
      WHERE "id" = ${sid} AND "jtiAnterior" = ${apresentado} AND "jtiAtual" = ${jtiAtualLido} AND "encerradaEm" IS NULL AND "expiraEm" > NOW()
      RETURNING "jtiAtual", "jtiAnterior", FLOOR(EXTRACT(EPOCH FROM "expiraEm"))::int AS "expiraEmEpoch", GREATEST(CEIL(EXTRACT(EPOCH FROM ("expiraEm" - NOW())))::int, 0) AS "restanteSegundos"`;
    return rows[0] ?? null;
  }

  /**
   * Encerra a sessão (idempotente: a segunda chamada não altera nada).
   * @param {string} sid
   * @param {string} motivo
   * @returns {Promise<boolean>} `true` se esta chamada encerrou; `false` se já estava encerrada ou não existe
   */
  async encerrar(sid, motivo) {
    const rows = await prisma.$queryRaw`
      UPDATE "sessoes_login"
      SET "encerradaEm" = NOW(), "motivoEncerramento" = ${motivo}, "dataAtualizacao" = NOW()
      WHERE "id" = ${sid} AND "encerradaEm" IS NULL
      RETURNING "id"`;
    return rows.length > 0;
  }

  /**
   * Apaga as sessões do usuário vencidas ou encerradas há mais de `dias` dias.
   * @param {string} idUsuario
   * @param {number} dias
   * @returns {Promise<number>} linhas apagadas
   */
  async limparDoUsuario(idUsuario, dias) {
    return await prisma.$executeRaw`
      DELETE FROM "sessoes_login"
      WHERE "idUsuario" = ${idUsuario}
        AND (NOW() - (${dias}::int * INTERVAL '1 day') > "expiraEm"
          OR NOW() - (${dias}::int * INTERVAL '1 day') > "encerradaEm")`;
  }
}
