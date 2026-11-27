import { jest } from '@jest/globals';
import { ConfiguracaoEscolaSeed } from '../../../../src/db/seeds/models/configuracaoEscolaSeed.js';
import { InitialSetting } from '../../../../src/InitialSetting.js';
import { CreateConfiguracaoService } from '../../../../src/services/configuracao/createConfiguracaoService.js';
import { CreateDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/createDiaDeFuncionamentoService.js';
import { DeleteDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/deleteDiaDeFuncionamentoService.js';
import { GetDiaDeFuncionamentoListService } from '../../../../src/services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js';
import { UpdateDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/updateDiaDeFuncionamentoService.js';

const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

describe('ConfiguracaoEscolaSeed', () => {
  let initial;
  let criaDia;
  let criaConfiguracao;
  let removeDia;
  let atualiza;

  beforeEach(() => {
    initial = jest.spyOn(InitialSetting, 'handle').mockImplementation(async () => {});
    jest.spyOn(GetDiaDeFuncionamentoListService, 'handle').mockImplementation(async () =>
      DIAS.map(diaSemana => ({
        id: `id-${diaSemana}`,
        diaSemana,
        horaInicial: '08:00',
        horaFinal: '18:00',
        ativo: true,
        configuracaoId: 'config-1'
      }))
    );
    atualiza = jest
      .spyOn(UpdateDiaDeFuncionamentoService, 'handle')
      .mockImplementation(async (id, data) => ({ id, ...data }));
    criaDia = jest
      .spyOn(CreateDiaDeFuncionamentoService, 'handle')
      .mockImplementation(async data => data);
    criaConfiguracao = jest
      .spyOn(CreateConfiguracaoService, 'handle')
      .mockImplementation(async data => data);
    removeDia = jest
      .spyOn(DeleteDiaDeFuncionamentoService, 'handle')
      .mockImplementation(async id => id);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('chama o boot 1x e desativa só SABADO e DOMINGO', async () => {
    const resultado = await ConfiguracaoEscolaSeed.handle();

    expect(initial).toHaveBeenCalledTimes(1);
    expect(atualiza).toHaveBeenCalledTimes(2);
    expect(atualiza).toHaveBeenCalledWith('id-SABADO', { ativo: false });
    expect(atualiza).toHaveBeenCalledWith('id-DOMINGO', { ativo: false });
    expect(resultado.configuracoes).toBe(1);
    expect(resultado.dias).toHaveLength(7);
    for (const dia of ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']) {
      expect(resultado.dias.find(d => d.diaSemana === dia).ativo).toBe(true);
    }
    expect(resultado.dias.find(d => d.diaSemana === 'SABADO').ativo).toBe(false);
    expect(resultado.dias.find(d => d.diaSemana === 'DOMINGO').ativo).toBe(false);
  });

  test('nunca cria nem remove dia, nem cria configuração', async () => {
    await ConfiguracaoEscolaSeed.handle();

    expect(criaDia).toHaveBeenCalledTimes(0);
    expect(criaConfiguracao).toHaveBeenCalledTimes(0);
    expect(removeDia).toHaveBeenCalledTimes(0);
  });

  test('controles positivos: cada spy de ausência registra chamada direta', async () => {
    await CreateDiaDeFuncionamentoService.handle({});
    await CreateConfiguracaoService.handle({});
    await DeleteDiaDeFuncionamentoService.handle('x');

    expect(criaDia).toHaveBeenCalledTimes(1);
    expect(criaConfiguracao).toHaveBeenCalledTimes(1);
    expect(removeDia).toHaveBeenCalledTimes(1);
  });

  test('falha quando o boot não deixou o dia de fim de semana', async () => {
    GetDiaDeFuncionamentoListService.handle.mockImplementation(async () => [
      { id: 'id-SEGUNDA', diaSemana: 'SEGUNDA', ativo: true, configuracaoId: 'config-1' }
    ]);

    await expect(ConfiguracaoEscolaSeed.handle()).rejects.toThrow(/SABADO/);
  });
});
