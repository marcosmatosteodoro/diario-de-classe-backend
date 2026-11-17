import { randomUUID } from 'node:crypto';
import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository do contador de tentativas de login (janela fixa por chave).
 */
export default class TentativaLoginRepository extends AbstractRepository {
  getEntity() {
    return prisma.tentativaLogin;
  }

  /**
   * @returns {{ contagem: boolean, expiraEm: boolean }}
   */
  getSelectFields() {
    return { contagem: true, expiraEm: true };
  }

  /**
   * Incrementa o contador da chave em uma única instrução (sem ler-e-gravar):
   * cria a linha com contagem 1 ou soma 1; se a janela da linha já expirou,
   * recomeça em 1 com nova expiração. O relógio é o do banco (`NOW()`).
   * @param {string} chave
   * @param {number} janelaSegundos - duração da janela, em segundos
   * @returns {Promise<{ contagem: number, segundosRestantes: number, expiraEm: string }>}
   *   segundos até a janela terminar, calculados pelo banco (mínimo 1), e o fim da janela
   *   em que a tentativa foi contada, como texto opaco (identifica a janela para a devolução;
   *   não depende do fuso da sessão nem do driver)
   */
  async incrementar(chave, janelaSegundos) {
    // id gerado aqui porque o INSERT é SQL cru e não passa pelo @default(cuid()) do Prisma.
    const rows = await prisma.$queryRaw`
      INSERT INTO "tentativas_login" ("id", "chave", "contagem", "expiraEm", "dataCriacao", "dataAtualizacao")
      VALUES (${randomUUID()}, ${chave}, 1, NOW() + (${janelaSegundos}::int * INTERVAL '1 second'), NOW(), NOW())
      ON CONFLICT ("chave") DO UPDATE SET
        "contagem" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN 1 ELSE "tentativas_login"."contagem" + 1 END,
        "expiraEm" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN NOW() + (${janelaSegundos}::int * INTERVAL '1 second') ELSE "tentativas_login"."expiraEm" END,
        "dataAtualizacao" = NOW()
      RETURNING "contagem", GREATEST(CEIL(EXTRACT(EPOCH FROM ("tentativas_login"."expiraEm" - NOW())))::int, 1) AS "segundosRestantes", "tentativas_login"."expiraEm"::text AS "expiraEm"`;
    return rows[0];
  }

  /**
   * Devolve uma tentativa ao contador (nunca abaixo de zero), em uma instrução atômica,
   * apenas se a linha ainda estiver na janela em que a tentativa foi contada: janela que
   * já virou não é alterada (0 linhas afetadas, sem erro).
   * @param {string} chave
   * @param {string} expiraEm - fim da janela devolvido por `incrementar` (token opaco)
   * @returns {Promise<number>} linhas afetadas
   */
  async decrementar(chave, expiraEm) {
    return await prisma.$executeRaw`
      UPDATE "tentativas_login"
      SET "contagem" = GREATEST("contagem" - 1, 0), "dataAtualizacao" = NOW()
      WHERE "chave" = ${chave} AND "expiraEm" = ${expiraEm}::timestamp(3)`;
  }

  /**
   * Remove a linha da chave; chave inexistente não é erro.
   * @param {string} chave
   * @returns {Promise<{ count: number }>}
   */
  async removerPorChave(chave) {
    return await this.entity.deleteMany({ where: { chave } });
  }
}
