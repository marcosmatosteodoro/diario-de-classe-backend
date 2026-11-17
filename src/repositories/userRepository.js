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

  /**
   * Whitelist de saída de `user` (professor/admin). `senha: false` mantém a
   * senha fora da projeção quando o service passa
   * `select: this.repository.selectFields`.
   *
   * `resetarSenha` está na whitelist e é gravável em create/update; nenhum
   * código do sistema o consome.
   * @returns {Object} objeto de projeção Prisma (`select`)
   */
  getSelectFields() {
    return {
      id: true,
      nome: true,
      sobrenome: true,
      nomeCompleto: true,
      email: true,
      telefone: true,
      senha: false,
      resetarSenha: true,
      permissao: true,
      idiomas: true,
      disponibilidades: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }
}
