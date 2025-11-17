import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com usuários
 * Centraliza todas as operações de banco de dados relacionadas aos usuários
 */
export default class DisponibilidadeProfessorRepository extends AbstractRepository {
  getEntity() {
    return prisma.disponibilidadeProfessor;
  }

  getSelectFields() {
    return {
      id: true,
      diaDaSemana: true,
      horaInicial: true,
      horaFinal: true,
      ativo: true,
      userId: true
    };
  }
}
