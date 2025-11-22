import { CreateConfiguracaoService } from './services/configuracao/createConfiguracaoService.js';
import { DeleteConfiguracaoService } from './services/configuracao/deleteConfiguracaoService.js';
import { GetConfiguracaoService } from './services/configuracao/getConfiguracaoService.js';
import { CreateDiaDeFuncionamentoService } from './services/diaDeFuncionamento/createDiaDeFuncionamentoService.js';
import { DeleteDiaDeFuncionamentoService } from './services/diaDeFuncionamento/deleteDiaDeFuncionamentoService.js';
import { GetDiaDeFuncionamentoListService } from './services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js';

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
    const isDiaDeFuncionamentoExists = await this.isDiaDeFuncionamentoExists();
    const isConfiguracaoExists = await this.isConfiguracaoExists();

    if (!isConfiguracaoExists) {
      await this.createConfiguracao();
    }

    if (!this.isConfiguracaoValid()) {
      await this.fixConfiguracao();
    }

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

  async createDiaDeFuncionamento() {
    const dias = this.dias;
    const diasDeFuncionamento = [];

    for (const dia of dias) {
      const diaDeFuncionamento = await CreateDiaDeFuncionamentoService.handle({
        diaDaSemana: dia,
        horaInicial: '08:00',
        horaFinal: '18:00',
        ativo: true,
        configuracaoId: this.configuracao.id
      });

      diasDeFuncionamento.push(diaDeFuncionamento);
    }

    this.diasDeFuncionamento = diasDeFuncionamento;
  }

  isDiaDeFuncionamentoValid() {
    if (this.diasDeFuncionamento.length !== 7) {
      this.diaDeFuncionamentoError = '!==7';
      return false;
    }

    if (this.diasDeFuncionamento.some(dia => !this.dias.includes(dia.diaDaSemana))) {
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
      const diasDeFuncionamento = this.diasDeFuncionamento;

      for (const diaDeFuncionamento of diasDeFuncionamento) {
        await DeleteDiaDeFuncionamentoService.handle(diaDeFuncionamento.id);
      }

      await this.createDiaDeFuncionamento();
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
      duracaoDaAula: 40,
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
      const configuracoes = this.configuracoes;

      for (const configuracao of configuracoes) {
        await DeleteConfiguracaoService.handle(configuracao.id);
      }

      await this.createConfiguracao();
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
