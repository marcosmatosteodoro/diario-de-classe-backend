import { CreateDisponibilidadeProfessorService } from '../../../services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';
import BaseSeed from '../baseSeed.js';

export class DisponibilidadeProfessorSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getDisponibilidade({ dia, isAtivo, id }) {
    return {
      diaSemana: dia,
      horaInicial: '08:00',
      horaFinal: '12:00',
      ativo: isAtivo,
      userId: id
    };
  }

  getCreateEntityService() {
    return CreateDisponibilidadeProfessorService;
  }

  generateMocks(params) {
    const diasAtivos = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'];
    const diasInativos = ['SABADO', 'DOMINGO'];
    const mocks = [];

    if (!params || !params.professores || params.professores.length === 0) {
      throw new Error(
        'Professores não encontrados para gerar seeds da disponibilidade dos professores'
      );
    }

    const { professores } = params;

    professores.map(professor => {
      const idProfessor = professor.id;
      for (const dia of diasAtivos) {
        const disponibilidade = this.getDisponibilidade({ dia, isAtivo: true, id: idProfessor });
        mocks.push(disponibilidade);
      }

      for (const dia of diasInativos) {
        const disponibilidade = this.getDisponibilidade({ dia, isAtivo: false, id: idProfessor });
        mocks.push(disponibilidade);
      }
    });

    return mocks;
  }

  static async handle(params) {
    const disponibilidadeProfessorSeed = new DisponibilidadeProfessorSeed(params);
    return await disponibilidadeProfessorSeed.execute();
  }
}
