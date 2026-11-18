import { randomUUID } from 'node:crypto';
import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import SessaoLoginRepository from '../../repositories/sessaoLoginRepository.js';
import Constants from '../../utilities/constants.js';
import ServiceUnavailableError from '../../utilities/errors/serviceUnavailable.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { emitirAccess } from '../../utilities/emitirAccess.js';
import { emitirRefresh } from '../../utilities/emitirRefresh.js';
import { verificarRefreshJwt } from '../../utilities/verificarRefreshJwt.js';
import { GetConfiguracaoService } from '../configuracao/getConfiguracaoService.js';

const ACAO = {
  rotacionar: 'rotacionar',
  tolerar: 'tolerar',
  substituir: 'substituir',
  reuso: 'reuso',
  recusar: 'recusar'
};

export class RefreshTokenService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
    this.sessoes = new SessaoLoginRepository();
  }

  /**
   * Renova a sessão do refresh pelas regras da DEC-005-015: (a) `jti` atual rotaciona; (b) `jti`
   * anterior dentro da tolerância recebe o mesmo sucessor, sem escrita; (c) `jti` anterior fora da
   * tolerância troca o sucessor (resposta perdida); (d) qualquer outro `jti` é reuso. A vida da
   * sessão nunca se estende: o `exp` do refresh novo é o fim absoluto dela (DEC-005-016).
   * Na regra (d), `jti` que não é o atual nem o anterior de uma sessão ativa, a sessão é
   * encerrada com o motivo `reuso`; a releitura do perdedor de corrida nunca aplica (d).
   * @returns {Promise<{
   *   accessToken: string,
   *   refreshToken: string,
   *   tokenType: 'Bearer',
   *   expiresIn: number,
   *   restanteSegundos: number,
   *   user: Object,
   *   configuracao: Object|null
   * }|false|{ reuso: { idUsuario: string, idSessao: string } }>} sucesso (`refreshToken` e
   *   `restanteSegundos` ficam no objeto e o controller os leva ao cookie, fora do corpo); `false`
   *   na recusa simples; `{ reuso }` quando a regra (d) encerrou a sessão ativa (o controller
   *   registra o evento)
   * @throws {ServiceUnavailableError} quando o registro falha ou a corrida não converge em 1 retry
   *   (a causa é logada só com `name` e `code`)
   */
  async execute() {
    const credencial = this.lerCredencial();
    if (!credencial) {
      return false;
    }

    const sessao = await this.resolverSessao(credencial);
    if (!sessao) {
      return false;
    }
    if (sessao.reuso) {
      return sessao;
    }

    return await this.montarResposta(credencial, sessao);
  }

  /** Refresh com `sid` e `jti`: sem eles (credencial legada) não há o que consultar. */
  lerCredencial() {
    if (!this.refreshToken) {
      return null;
    }
    const payload = this.verifyRefreshToken();
    if (!payload || !this.ehTextoNaoVazio(payload.sid) || !this.ehTextoNaoVazio(payload.jti)) {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid, jti: payload.jti };
  }

  ehTextoNaoVazio(valor) {
    return typeof valor === 'string' && valor !== '';
  }

  /**
   * 1 leitura e 1 escrita no caso comum. Escrita sem linhas (perdeu a corrida) relê uma vez e
   * reclassifica; a releitura só resolve por recusa ou tolerância, nunca por nova escrita.
   * @returns {Promise<{ estado: Object, jti: string }|{ reuso: Object }|null>} `null` na recusa
   */
  async resolverSessao(credencial) {
    const estado = await this.acessarRegistro(() => this.sessoes.lerEstado(credencial.sid));
    const acao = this.classificar(estado, credencial);
    if (acao === ACAO.recusar) {
      return null;
    }
    if (acao === ACAO.tolerar) {
      return { estado, jti: estado.jtiAtual };
    }
    if (acao === ACAO.reuso) {
      return await this.encerrarPorReuso(credencial);
    }

    const novoJti = randomUUID();
    const escrita = await this.acessarRegistro(() =>
      this.escrever(acao, credencial, estado, novoJti)
    );
    if (escrita) {
      return { estado, jti: novoJti };
    }
    return await this.resolverAposPerder(credencial);
  }

  /** `encerrar` sem linhas: a sessão já foi encerrada por outro pedido, então não há derrubada a registrar. */
  async encerrarPorReuso({ sub, sid }) {
    const encerrada = await this.acessarRegistro(() => this.sessoes.encerrar(sid, 'reuso'));
    return encerrada ? { reuso: { idUsuario: sub, idSessao: sid } } : null;
  }

  /**
   * O `jti` era o atual na primeira leitura: cair em (d) na releitura (duas rotações no intervalo)
   * não é sinal de cópia, então recusa sem encerrar.
   */
  async resolverAposPerder(credencial) {
    const estado = await this.acessarRegistro(() => this.sessoes.lerEstado(credencial.sid));
    const acao = this.classificar(estado, credencial);
    if (acao === ACAO.recusar || acao === ACAO.reuso) {
      return null;
    }
    if (acao === ACAO.tolerar) {
      return { estado, jti: estado.jtiAtual };
    }
    throw new ServiceUnavailableError();
  }

  escrever(acao, { sid, jti }, estado, novoJti) {
    if (acao === ACAO.rotacionar) {
      return this.sessoes.rotacionar(sid, jti, novoJti);
    }
    return this.sessoes.substituirSucessor(sid, jti, estado.jtiAtual, novoJti);
  }

  /**
   * Sessão inexistente, de outro dono, encerrada ou vencida e `jti` desconhecido são recusa.
   * Só sessão ativa chega à regra (d): a encerrada ou vencida é recusa simples, sem reuso.
   */
  classificar(estado, { sub, jti }) {
    if (!estado || estado.ativa !== true || estado.idUsuario !== sub) {
      return ACAO.recusar;
    }
    if (jti === estado.jtiAtual) {
      return ACAO.rotacionar;
    }
    if (jti !== estado.jtiAnterior) {
      return ACAO.reuso;
    }
    return estado.dentroDaTolerancia ? ACAO.tolerar : ACAO.substituir;
  }

  /** Falha do registro nega com 503; o cookie do cliente fica como está e a renovação é repetível. */
  async acessarRegistro(operacao) {
    try {
      return await operacao();
    } catch (error) {
      LoggerManager.error('[RefreshTokenService] Falha ao acessar o registro de sessões', {
        name: error?.name,
        code: error?.code
      });
      throw new ServiceUnavailableError();
    }
  }

  async montarResposta({ sub, sid }, { estado, jti }) {
    const user = await this.repository.selectOne({
      where: { id: sub },
      select: this.repository.selectFields
    });

    if (!this.usuarioPodeRenovar(user)) {
      return false;
    }

    const configuracoes = await GetConfiguracaoService.handle();

    return {
      accessToken: emitirAccess(user, sid),
      refreshToken: emitirRefresh({ sub, sid, jti, expiraEmEpoch: estado.expiraEmEpoch }),
      tokenType: 'Bearer',
      expiresIn: Constants.accessExp,
      restanteSegundos: estado.restanteSegundos,
      user,
      configuracao: configuracoes?.[0] ?? null
    };
  }

  /**
   * Gancho da decisão "este usuário pode renovar?". Hoje só exige que exista;
   * a desativação de usuário (Q-002-003) entra aqui.
   */
  usuarioPodeRenovar(user) {
    return Boolean(user);
  }

  verifyRefreshToken() {
    return verificarRefreshJwt(this.refreshToken);
  }

  static async handle(refreshToken) {
    const Repository = UserRepository;
    const service = new RefreshTokenService(Repository, refreshToken);
    return await service.execute();
  }
}
