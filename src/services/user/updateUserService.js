import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { getNomeCompleto } from '../../utilities/getNomeCompleto.js';
import { hashSenha } from '../../utilities/password.js';

export class UpdateUserService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  /**
   * Atualiza o usuário. `resetarSenha` é aceito e gravado; nenhum código do
   * sistema o consome. Campos `undefined` em `this.data` são removidos antes
   * do update (atualização parcial); o `select` com `senha: false` mantém a
   * senha fora da resposta.
   *
   * `senha` ausente, vazia, só espaços ou `null` é ignorada e nunca
   * sobrescreve a senha existente (DEC-002-001).
   * @returns {Promise<Object>} usuário atualizado, projetado pela whitelist de saída
   */
  async execute() {
    const senhaFornecida = typeof this.data.senha === 'string' && this.data.senha.trim() !== '';

    const data = {
      nome: this.data.nome,
      sobrenome: this.data.sobrenome,
      nomeCompleto: getNomeCompleto(this.data),
      email: this.data.email,
      telefone: this.data.telefone,
      // DEC-002-001: senha ausente/vazia/só-espaços/null é "não fornecida" e nunca
      // sobrescreve a senha existente; só a fornecida é hasheada.
      senha: senhaFornecida ? await hashSenha(this.data.senha) : undefined,
      resetarSenha: this.data.resetarSenha,
      permissao: this.data.permissao,
      idiomas: this.data.idiomas
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} data campos parciais de usuário (undefined vira remoção da chave)
   * @param {string|null} [data.senha] ausente, vazia, só espaços ou `null` é ignorada e nunca
   *   sobrescreve a senha existente (DEC-002-001)
   * @returns {Promise<Object>} ver `execute()`
   */
  static async handle(id, data) {
    const Repository = UserRepository;
    const service = new UpdateUserService(Repository, id, data);
    return await service.execute();
  }
}
