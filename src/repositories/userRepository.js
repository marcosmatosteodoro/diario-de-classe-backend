import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com usuários
 * Centraliza todas as operações de banco de dados relacionadas aos usuários
 */
export default class UserRepository extends AbstractRepository {
  getEntity() {
    return prisma.user;
  }

  getSelectFields() {
    return {
      id: true,
      nome: true,
      sobrenome: true,
      email: true,
      telefone: true,
      senha: false,
      resetarSenha: true,
      permissao: true,
      disponibilidades: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }
}
