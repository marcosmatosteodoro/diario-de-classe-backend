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
   * @returns {Promise<{ contagem: number, expiraEm: Date }>}
   */
  async incrementar(chave, janelaSegundos) {
    const rows = await prisma.$queryRaw`
      INSERT INTO "tentativas_login" ("id", "chave", "contagem", "expiraEm", "dataCriacao", "dataAtualizacao")
      VALUES (${randomUUID()}, ${chave}, 1, NOW() + (${janelaSegundos}::int * INTERVAL '1 second'), NOW(), NOW())
      ON CONFLICT ("chave") DO UPDATE SET
        "contagem" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN 1 ELSE "tentativas_login"."contagem" + 1 END,
        "expiraEm" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN NOW() + (${janelaSegundos}::int * INTERVAL '1 second') ELSE "tentativas_login"."expiraEm" END,
        "dataAtualizacao" = NOW()
      RETURNING "contagem", "expiraEm"`;
    return rows[0];
  }

  /**
   * @param {string} chave
   * @returns {Promise<{ contagem: number, expiraEm: Date } | null>}
   */
  async buscarPorChave(chave) {
    return await this.entity.findUnique({ where: { chave }, select: this.selectFields });
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
