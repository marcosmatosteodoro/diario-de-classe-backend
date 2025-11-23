import { CreateAulaService } from '../../../services/aula/createAulaService.js';
import BaseSeed from '../baseSeed.js';

export class AulasSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getCreateEntityService() {
    return CreateAulaService;
  }

  getDataEHorarios() {
    return {
      dataAula: new Date(),
      horaInicial: '10:00',
      horaFinal: '10:40',
      status: 'AGENDADA'
    };
  }

  getTipo() {
    return 'PADRAO';
  }

  generateAulaDate({ idAluno, idProfessor, idContrato }) {
    const { dataAula, horaInicial, horaFinal, status } = this.getDataEHorarios();
    const tipo = this.getTipo();

    return {
      idAluno: idAluno,
      idProfessor: idProfessor,
      idContrato: idContrato,
      dataAula: dataAula,
      horaInicial: horaInicial,
      horaFinal: horaFinal,
      status: status,
      tipo: tipo,
      observacao: 'vdvdsvdsvdsvdsvds'
    };
  }

  getIdContrato({ contratos, aluno }) {
    const contrato = contratos.find(contrato => contrato.idAluno === aluno.id);

    if (!contrato) {
      throw new Error('Contrato não encontrado do aluno');
    }

    return contrato.id;
  }

  getIdProfessor(professores) {
    return professores[0].id;
  }

  generateMocks(params) {
    const mocks = [];

    if (!params) {
      throw new Error('Parâmetros não encontrados para gerar seeds das aulas');
    }

    if (!params.alunos || params.alunos.length === 0) {
      throw new Error('Alunos não encontrados para gerar seeds das aulas');
    }

    if (!params.contratos || params.contratos.length === 0) {
      throw new Error('Contratos não encontrados para gerar seeds das aulas');
    }

    if (!params.professores || params.professores.length === 0) {
      throw new Error('Professores não encontrados para gerar seeds das aulas');
    }

    const { alunos, contratos, professores } = params;

    alunos.map(aluno => {
      const idAluno = aluno.id;
      const idContrato = this.getIdContrato({ contratos, aluno });
      const idProfessor = this.getIdProfessor(professores);

      const aula = this.generateAulaDate({ idAluno, idProfessor, idContrato });

      mocks.push(aula);
    });

    return mocks;
  }

  static async handle(params) {
    const aulasSeed = new AulasSeed(params);
    return await aulasSeed.execute();
  }
}
