import { CreateDiaAulaService } from '../../../services/diaAula/createDiaAulaService.js';
import BaseSeed from '../baseSeed.js';

export class DiaAulasSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getDisponibilidade({ idAluno, idContrato, diaSemana, quantidadeAulas }) {
    return {
      idAluno: idAluno,
      idContrato: idContrato,
      diaSemana: diaSemana,
      quantidadeAulas: quantidadeAulas,
      horaInicial: '08:00',
      horaFinal: '12:00'
    };
  }

  getDias() {
    return ['SEGUNDA', 'QUARTA', 'SEXTA'];
  }

  getQuantidadeDeaulas() {
    return 1;
  }

  getCreateEntityService() {
    return CreateDiaAulaService;
  }

  getIdContrato({ contratos, aluno }) {
    const contrato = contratos.find(contrato => contrato.idAluno === aluno.id);

    if (!contrato) {
      throw new Error('Contrato não encontrado do aluno');
    }

    return contrato.id;
  }

  generateMocks(params) {
    const mocks = [];

    if (!params) {
      throw new Error('Parâmetros não encontrados para gerar seeds dos dias de aulas dos alunos');
    }

    if (!params.alunos || params.alunos.length === 0) {
      throw new Error('Alunos não encontrados para gerar seeds dos dias de aulas dos alunos');
    }

    if (!params.contratos || params.contratos.length === 0) {
      throw new Error('Contratos não encontrados para gerar seeds dos dias de aulas dos alunos');
    }

    const { alunos, contratos } = params;

    alunos.map(aluno => {
      const idAluno = aluno.id;
      const dias = this.getDias();
      const quantidadeAulas = this.getQuantidadeDeaulas();
      const idContrato = this.getIdContrato({ contratos, aluno });

      for (const dia of dias) {
        const diaAula = this.getDisponibilidade({
          idAluno: idAluno,
          idContrato: idContrato,
          diaSemana: dia,
          quantidadeAulas: quantidadeAulas
        });
        mocks.push(diaAula);
      }
    });

    return mocks;
  }

  static async handle(professores) {
    const diaAulasSeed = new DiaAulasSeed(professores);
    return await diaAulasSeed.execute();
  }
}
