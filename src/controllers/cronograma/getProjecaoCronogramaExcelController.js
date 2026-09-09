import { AbstractCronogramaController } from './AbstractCronogramaController.js';
import { GetProjecaoCronogramaService } from '../../services/cronograma/getProjecaoCronogramaService.js';
import { generateExcel } from '../../utilities/generateExcel.js';
import { getNomeCompleto } from '../../utilities/getNomeCompleto.js';
import { dataAulaKey } from '../../utilities/dataAulaKey.js';

/**
 * Exporta a planilha do cronograma do aluno em xlsx.
 *
 * Mesma leitura de GetProjecaoCronogramaController, so muda o formato de saida.
 * Cabecalhos em portugues porque a planilha vai para a mao da secretaria.
 */
export class GetProjecaoCronogramaExcelController extends AbstractCronogramaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      const aluno = await this.getAlunoAcessivel(idAluno);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      const projecao = await GetProjecaoCronogramaService.handle(
        idAluno,
        this.where,
        this.req.query.idContrato || null
      );

      if (!projecao) {
        return this.res.status(204).json();
      }

      const nome = getNomeCompleto(aluno) || aluno.nome;
      const data = this.montarPlanilha(projecao);

      const excelBuffer = generateExcel({
        res: this.res,
        filename: `Cronograma - ${nome}`,
        data,
        sheetName: 'Cronograma'
      });

      return this.res.status(200).send(excelBuffer);
    } catch (error) {
      return this.handleError(error, 'cronogramas.excel.error');
    }
  }

  montarPlanilha({ cronograma, linhas, conteudosNaoAgendados }) {
    const aulas = linhas.map(linha => ({
      // Nome do livro da propria linha: a aula concluida de um livro anterior
      // seria rotulada com o nome do livro atual.
      Livro: linha.livroNome ?? '',
      Ordem: linha.ordem ?? '',
      Conteudo: linha.titulo ?? '',
      Descricao: linha.descricao ?? '',
      Data: linha.dataAula ? dataAulaKey(linha.dataAula) : '',
      Inicio: linha.horaInicial,
      Fim: linha.horaFinal,
      Tipo: linha.tipo,
      Status: linha.status
    }));

    // Conteudo que nao caiu em nenhuma aula entra no fim, sem data: e o sinal
    // de que o livro nao termina dentro do contrato atual.
    const naoAgendados = conteudosNaoAgendados.map(conteudo => ({
      Livro: cronograma.livro?.nome ?? '',
      Ordem: conteudo.ordem,
      Conteudo: conteudo.titulo,
      Descricao: conteudo.descricao ?? '',
      Data: '',
      Inicio: '',
      Fim: '',
      Tipo: '',
      Status: 'SEM AULA'
    }));

    return [...aulas, ...naoAgendados];
  }

  static async handle(req, res) {
    const controller = new GetProjecaoCronogramaExcelController(req, res);
    await controller.execute();
  }
}
