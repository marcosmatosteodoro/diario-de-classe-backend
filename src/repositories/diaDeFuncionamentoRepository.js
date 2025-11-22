import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com usuários
 * Centraliza todas as operações de banco de dados relacionadas aos usuários
 */
export default class DiaDeFuncionamentoRepository extends AbstractRepository {
  getEntity() {
    return prisma.diaDeFuncionamento;
  }

  getSelectFields() {
    return {
      id: true,
      diaSemana: true,
      horaInicial: true,
      horaFinal: true,
      ativo: true,
      configuracaoId: true
    };
  }
}
