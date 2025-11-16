import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com configurações
 * Centraliza todas as operações de banco de dados relacionadas à entidade Configuracao
 */
export default class ConfiguracaoRepository extends AbstractRepository {
  getEntity() {
    return prisma.configuracao;
  }

  getSelectFields() {
    return {
      id: true,
      duracaoDaAula: true,
      tolerancia: true,
      diasDeFuncionamento: true
    };
  }
}
