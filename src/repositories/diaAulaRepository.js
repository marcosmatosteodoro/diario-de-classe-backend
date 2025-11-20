import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com DiaAula
 * Centraliza todas as operações de banco de dados relacionadas aos DiaAula
 */
export default class DiaAulaRepository extends AbstractRepository {
  getEntity() {
    return prisma.diaAula;
  }

  getSelectFields() {
    return {
      id: true,
      diaDaSemana: true,
      horaInicial: true,
      horaFinal: true,
      ativo: true,
      configuracaoId: true
    };
  }
}
