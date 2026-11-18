import { CreateDisponibilidadeProfessorService } from '../../../services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';
import BaseSeed from '../baseSeed.js';

const DIAS_ATIVOS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'];
const DIAS_INATIVOS = ['SABADO', 'DOMINGO'];

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
    if (!params || !params.professores || params.professores.length === 0) {
      throw new Error(
        'Professores não encontrados para gerar seeds da disponibilidade dos professores'
      );
    }

    return params.professores.flatMap(professor => [
      ...DIAS_ATIVOS.map(dia => this.getDisponibilidade({ dia, isAtivo: true, id: professor.id })),
      ...DIAS_INATIVOS.map(dia =>
        this.getDisponibilidade({ dia, isAtivo: false, id: professor.id })
      )
    ]);
  }

  static async handle(params) {
    const disponibilidadeProfessorSeed = new DisponibilidadeProfessorSeed(params);
    return await disponibilidadeProfessorSeed.execute();
  }
}
