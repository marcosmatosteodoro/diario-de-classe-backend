import { ConfiguracaoEscolaSeed } from './models/configuracaoEscolaSeed.js';
import { ProfessoresSeed } from './models/professoresSeed.js';
import { DisponibilidadeProfessorSeed } from './models/disponibilidadeProfessorSeed.js';
import { AlunosSeed } from './models/alunosSeed.js';
import { ContratosSeed } from './models/contratosSeed.js';
import { DiaAulasSeed } from './models/diaAulasSeed.js';
import { AulasSeed } from './models/aulasSeed.js';
import { LivrosSeed } from './models/livrosSeed.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';
import { ALUNOS_DEMO, CONTAS_FIXAS_DEMO, PROFESSORES_DEMO } from './seedCatalogo.js';
import { gerarAgenda } from './gerarAgenda.js';

const CHAVES_PROFESSORES = [...CONTAS_FIXAS_DEMO, ...PROFESSORES_DEMO].map(c => c.chave);

// A correspondência chave → id é por posição; comprimento divergente quebra a ligação das
// etapas seguintes, então falha em vez de seguir com ids trocados.
function mapaPorChave(chaves, criados, rotulo) {
  if (!Array.isArray(criados) || criados.length !== chaves.length) {
    throw new Error(
      `Seed de ${rotulo} devolveu ${criados?.length} registros para ${chaves.length} esperados`
    );
  }
  return new Map(chaves.map((chave, i) => [chave, criados[i].id]));
}

/**
 * Grava o catálogo fictício e a agenda relativa a `hoje` pelos services do domínio.
 * Os itens do catálogo são congelados: as etapas só leem deles e ligam por mapas de chave.
 * @param {{ hoje: string, senha: string }} opcoes `hoje` no formato `YYYY-MM-DD`; `senha` das 5 contas
 * @returns {Promise<{professores: number, disponibilidadeProfessores: number, alunos: number, contratos: number, diaAulas: number, aulas: number, livros: number, configuracoes: number}>}
 */
export async function executarEtapas({ hoje, senha }) {
  const agenda = gerarAgenda(hoje, ALUNOS_DEMO);

  const configuracao = await ConfiguracaoEscolaSeed.handle();

  const professores = await ProfessoresSeed.handle({ senha });
  const idProfessorPorChave = mapaPorChave(CHAVES_PROFESSORES, professores, 'professores');

  const disponibilidadeProfessores = await DisponibilidadeProfessorSeed.handle({ professores });

  const alunos = await AlunosSeed.handle();
  const idAlunoPorChave = mapaPorChave(
    ALUNOS_DEMO.map(a => a.chave),
    alunos,
    'alunos'
  );

  const contratos = await ContratosSeed.handle({ contratos: agenda.contratos, idAlunoPorChave });
  const idContratoPorChaveAluno = mapaPorChave(
    agenda.contratos.map(c => c.chaveAluno),
    contratos,
    'contratos'
  );

  const ligacao = { idAlunoPorChave, idContratoPorChaveAluno, idProfessorPorChave };

  const diaAulas = await DiaAulasSeed.handle({ diasAula: agenda.diasAula, ...ligacao });
  const aulas = await AulasSeed.handle({ aulas: agenda.aulas, ...ligacao });

  // Totais só depois da última aula: o recálculo conta o que já existe (DEC-004-006 · demonstracao).
  for (const contrato of contratos) {
    await UpdateAulasContratoService.handle(contrato.id);
  }

  const livros = await LivrosSeed.handle();

  return {
    professores: professores.length,
    disponibilidadeProfessores: disponibilidadeProfessores.length,
    alunos: alunos.length,
    contratos: contratos.length,
    diaAulas: diaAulas.length,
    aulas: aulas.length,
    livros: livros.length,
    configuracoes: configuracao.configuracoes
  };
}
