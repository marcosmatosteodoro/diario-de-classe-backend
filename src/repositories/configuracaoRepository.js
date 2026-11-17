import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com configurações
 * Centraliza todas as operações de banco de dados relacionadas à entidade Configuracao
 *
 * `tolerancia` é armazenada e editável por este repository (via services de
 * configuracao), mas nenhum consumidor foi encontrado fora do próprio CRUD —
 * não decide janela de atraso nem falta em nenhum outro ponto do domínio.
 */
export default class ConfiguracaoRepository extends AbstractRepository {
  getEntity() {
    return prisma.configuracao;
  }

  /**
   * @returns {{ id: boolean, duracaoAula: boolean, tolerancia: boolean, diasDeFuncionamento: boolean }}
   *   duracaoAula (minutos) é consumido por controllers de dia de aula e de
   *   contrato para calcular horaFinal a partir de horaInicial; tolerancia
   *   (minutos) só é lida/escrita aqui; diasDeFuncionamento traz os registros
   *   relacionados de DiaDeFuncionamento.
   */
  getSelectFields() {
    return {
      id: true,
      duracaoAula: true,
      tolerancia: true,
      diasDeFuncionamento: true
    };
  }
}
