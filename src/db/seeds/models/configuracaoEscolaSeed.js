import { InitialSetting } from '../../../InitialSetting.js';
import { GetDiaDeFuncionamentoListService } from '../../../services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js';
import { UpdateDiaDeFuncionamentoService } from '../../../services/diaDeFuncionamento/updateDiaDeFuncionamentoService.js';

const DIAS_INATIVOS = ['SABADO', 'DOMINGO'];

export class ConfiguracaoEscolaSeed {
  // O seed só desativa dias que o boot já criou: criar ou remover dia é do `InitialSetting`
  // (DEC-004-004 · demonstracao).
  async execute() {
    await InitialSetting.handle();
    const dias = await GetDiaDeFuncionamentoListService.handle();

    const resultado = [];
    for (const dia of dias) {
      if (DIAS_INATIVOS.includes(dia.diaSemana)) {
        const atualizado = await UpdateDiaDeFuncionamentoService.handle(dia.id, { ativo: false });
        resultado.push({ ...dia, ...atualizado, ativo: false });
      } else {
        resultado.push(dia);
      }
    }

    const faltantes = DIAS_INATIVOS.filter(d => !resultado.some(dia => dia.diaSemana === d));
    if (faltantes.length > 0) {
      throw new Error(`Dias de funcionamento não encontrados: ${faltantes.join(', ')}`);
    }

    const configuracoes = new Set(resultado.map(dia => dia.configuracaoId)).size;

    return { configuracoes, dias: resultado };
  }

  static async handle() {
    const seed = new ConfiguracaoEscolaSeed();
    return await seed.execute();
  }
}
