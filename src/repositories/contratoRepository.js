import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com contratos
 * Centraliza todas as operações de banco de dados relacionadas aos contratos
 */
export default class ContratoRepository extends AbstractRepository {
  getEntity() {
    return prisma.contrato;
  }

  /**
   * Whitelist padrao de saida: totais derivados do contrato mais nome/nomeCompleto
   * do aluno; não inclui a lista de `aulas` nem `diaAulas`.
   * @returns {Object}
   */
  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      dataInicio: true,
      dataTermino: true,
      status: true,
      totalAulas: true,
      totalAulasFeitas: true,
      totalReposicoes: true,
      totalFaltas: true,
      totalAulasCanceladas: true,
      dataCriacao: true,
      dataAtualizacao: true,
      idioma: true,
      aluno: {
        select: {
          nome: true,
          nomeCompleto: true
        }
      },
      diaAulas: false
    };
  }

  /**
   * Variante completa: aluno e diaAulas, mais `aulas` com o professor
   * projetado (nome/nomeCompleto). Usada quando o consumidor precisa do
   * detalhe, não só dos totais.
   * @returns {Object}
   */
  getSelectFieldsWithRelations() {
    return {
      id: true,
      idAluno: true,
      dataInicio: true,
      dataTermino: true,
      status: true,
      totalAulas: true,
      totalAulasFeitas: true,
      totalReposicoes: true,
      totalFaltas: true,
      totalAulasCanceladas: true,
      dataCriacao: true,
      dataAtualizacao: true,
      idioma: true,
      aluno: true,
      diaAulas: true,
      aulas: {
        select: {
          id: true,
          idAluno: true,
          idProfessor: true,
          idContrato: true,
          dataAula: true,
          horaInicial: true,
          horaFinal: true,
          duracaoAula: true,
          tipo: true,
          status: true,
          observacao: true,
          dataCriacao: true,
          dataAtualizacao: true,
          professor: {
            select: {
              nome: true,
              nomeCompleto: true
            }
          }
        }
      }
    };
  }
}
