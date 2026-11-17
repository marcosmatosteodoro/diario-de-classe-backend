import { CreateConfiguracaoService } from './services/configuracao/createConfiguracaoService.js';
import { GetConfiguracaoService } from './services/configuracao/getConfiguracaoService.js';
import { SubstituirConfiguracaoService } from './services/configuracao/substituirConfiguracaoService.js';
import { CreateDiaDeFuncionamentoService } from './services/diaDeFuncionamento/createDiaDeFuncionamentoService.js';
import { GetDiaDeFuncionamentoListService } from './services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js';
import { SubstituirDiasDeFuncionamentoService } from './services/diaDeFuncionamento/substituirDiasDeFuncionamentoService.js';

export class InitialSetting {
  constructor() {
    this.configuracoes = [];
    this.configuracao = null;
    this.configuracaoError = null;
    this.dias = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    this.diasDeFuncionamento = [];
    this.diaDeFuncionamentoError = null;
  }

  async start() {
    const isConfiguracaoExists = await this.isConfiguracaoExists();

    if (!isConfiguracaoExists) {
      await this.createConfiguracao();
    }

    if (!this.isConfiguracaoValid()) {
      await this.fixConfiguracao();
    }

    // Os dias são lidos depois da configuração resolvida: remover uma
    // configuração remove seus dias em cascata, e a leitura precisa refletir isso.
    const isDiaDeFuncionamentoExists = await this.isDiaDeFuncionamentoExists();

    if (!isDiaDeFuncionamentoExists) {
      await this.createDiaDeFuncionamento();
    }

    if (!this.isDiaDeFuncionamentoValid()) {
      await this.fixDiadeFuncionamento();
    }
  }

  async isDiaDeFuncionamentoExists() {
    const diasDeFuncionamento = await GetDiaDeFuncionamentoListService.handle();
    this.diasDeFuncionamento = diasDeFuncionamento;
    return diasDeFuncionamento && diasDeFuncionamento.length > 0;
  }

  diasPadrao() {
    return this.dias.map(dia => ({
      diaSemana: dia,
      horaInicial: '08:00',
      horaFinal: '18:00',
      ativo: true,
      configuracaoId: this.configuracao.id
    }));
  }

  async createDiaDeFuncionamento() {
    const diasDeFuncionamento = [];

    for (const dia of this.diasPadrao()) {
      const diaDeFuncionamento = await CreateDiaDeFuncionamentoService.handle(dia);

      diasDeFuncionamento.push(diaDeFuncionamento);
    }

    this.diasDeFuncionamento = diasDeFuncionamento;
  }

  isDiaDeFuncionamentoValid() {
    if (this.diasDeFuncionamento.length !== 7) {
      this.diaDeFuncionamentoError = '!==7';
      return false;
    }

    if (this.diasDeFuncionamento.some(dia => !this.dias.includes(dia.diaSemana))) {
      this.diaDeFuncionamentoError = 'diaInvalido';
      return false;
    }

    return true;
  }

  async fixDiadeFuncionamento() {
    this.log(
      `Dias de funcionamento inválidos encontrados. ${this.diaDeFuncionamentoError} ${this.diasDeFuncionamento.length}`
    );

    if (this.diaDeFuncionamentoError === '!==7' || this.diaDeFuncionamentoError === 'diaInvalido') {
      const ids = this.diasDeFuncionamento.map(dia => dia.id);

      this.diasDeFuncionamento = await SubstituirDiasDeFuncionamentoService.handle(
        ids,
        this.diasPadrao()
      );
    }
  }

  async isConfiguracaoExists() {
    const configuracoes = await GetConfiguracaoService.handle();

    if (configuracoes && configuracoes.length > 0) {
      this.configuracoes = configuracoes;
      this.configuracao = configuracoes[0];
      return true;
    }

    return false;
  }

  async createConfiguracao() {
    const newConfiguracao = await CreateConfiguracaoService.handle({
      duracaoAula: 40,
      tolerancia: 10
    });

    this.log(`Configuração inicial criada com sucesso${JSON.stringify(newConfiguracao)}`);
    this.configuracao = newConfiguracao;
  }

  isConfiguracaoValid() {
    if (this.configuracoes && this.configuracoes.length > 1) {
      this.configuracaoError = 'maisDeUmaConfiguracao';
      return false;
    }

    return true;
  }

  async fixConfiguracao() {
    if (this.configuracaoError === 'maisDeUmaConfiguracao') {
      const ids = this.configuracoes.map(configuracao => configuracao.id);

      const newConfiguracao = await SubstituirConfiguracaoService.handle(ids, {
        duracaoAula: 40,
        tolerancia: 10
      });

      this.log(`Configuração inicial recriada com sucesso${JSON.stringify(newConfiguracao)}`);
      this.configuracao = newConfiguracao;
      this.configuracoes = [newConfiguracao];
    }
  }

  log(message) {
    console.log(`\n[InitialSetting] ${message}`);
  }

  static async handle() {
    const initialSetting = new InitialSetting();
    return initialSetting.start();
  }
}
