import AbstractService from '../abstractService.js';
import SessaoLoginRepository from '../../repositories/sessaoLoginRepository.js';
import LoggerManager from '../../utilities/loggerManager.js';
import ServiceUnavailableError from '../../utilities/errors/serviceUnavailable.js';

export class VerificarSessaoAtivaService extends AbstractService {
  constructor(Repository, sid, idUsuario) {
    super(Repository);
    this.sid = sid;
    this.idUsuario = idUsuario;
  }

  /**
   * Uma única leitura por PK do registro; sem cache: o encerramento precisa valer na requisição
   * seguinte, em qualquer instância.
   * @returns {Promise<boolean>} `true` só para sessão ativa cujo dono é `idUsuario`
   * @throws {ServiceUnavailableError} quando o registro não responde (a causa é logada só com
   * `name` e `code`, nunca `message`, que pode embutir argumentos da consulta)
   */
  async execute() {
    let estado;
    try {
      estado = await this.repository.lerEstado(this.sid);
    } catch (error) {
      LoggerManager.error('[VerificarSessaoAtivaService] Falha ao ler a sessão', {
        name: error?.name,
        code: error?.code
      });
      throw new ServiceUnavailableError();
    }
    return estado?.ativa === true && estado.idUsuario === this.idUsuario;
  }

  /**
   * @param {string} sid
   * @param {string} idUsuario
   * @returns {Promise<boolean>}
   */
  static async handle(sid, idUsuario) {
    return await new VerificarSessaoAtivaService(SessaoLoginRepository, sid, idUsuario).execute();
  }
}
