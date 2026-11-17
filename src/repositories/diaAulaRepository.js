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

  /**
   * Whitelist de saida do dia de aula: dia da semana, janela de horario
   * (`horaInicial`/`horaFinal`) e quantidade/duracao das aulas — nao inclui as
   * relacoes `aluno` nem `contrato`. `duracaoAula` pode ser `null`.
   * @returns {Object}
   */
  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      idContrato: true,
      diaSemana: true,
      quantidadeAulas: true,
      duracaoAula: true,
      horaInicial: true,
      horaFinal: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }
}
