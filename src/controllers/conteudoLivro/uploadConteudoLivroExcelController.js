import fs from 'fs/promises';
import XLSX from 'xlsx';
import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { SubstituirConteudosLivroService } from '../../services/conteudoLivro/substituirConteudosLivroService.js';
import { GetConteudoLivroListService } from '../../services/conteudoLivro/getConteudoLivroListService.js';
import { ResequenciarCronogramasDoLivroService } from '../../services/cronograma/resequenciarCronogramasDoLivroService.js';
import { GetConteudosAcimaDaOrdemService } from '../../services/conteudoLivro/getConteudosAcimaDaOrdemService.js';
import { GetAulasCongeladasPorConteudosService } from '../../services/aula/getAulasCongeladasPorConteudosService.js';

/**
 * Importa a sequencia de conteudos de um livro a partir de planilha.
 *
 * Formato esperado: coluna A = titulo, coluna B = descricao (opcional). A ordem
 * dos conteudos e a ordem das linhas, e nao um numero na planilha -- e como a
 * secretaria ja mantem a lista hoje, e evita conflito com o indice unico
 * [idLivro, ordem] quando a planilha vem com numeracao repetida ou furada.
 *
 * A importacao SUBSTITUI o conteudo do livro. E destrutivo de proposito (a
 * planilha e a fonte da verdade), por isso e restrito a admin na rota.
 *
 * A troca e feita por posicao, entao o vinculo das aulas sobrevive. O que nao
 * pode acontecer e uma planilha MENOR remover posicao que ja tem aula
 * concluida: isso apagaria o registro do que foi dado. Nesse caso a importacao
 * e recusada inteira.
 */
export class UploadConteudoLivroExcelController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.maxConteudos = 500;
    this.maxCaracteresTitulo = 255;
    this.maxCaracteresDescricao = 2000;
    this.cabecalhosConhecidos = [
      'titulo',
      'título',
      'conteudo',
      'conteúdo',
      'aula',
      'licao',
      'lição',
      'unidade',
      'tarefa'
    ];
  }

  getXLSXDataByFile(file) {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }

  /**
   * A planilha da secretaria costuma vir com linha de cabecalho. Sem descartar,
   * "Titulo" entraria como o primeiro conteudo do livro.
   */
  isCabecalho(linha) {
    if (!linha || !linha[0]) return false;
    const primeiraCelula = String(linha[0]).trim().toLowerCase();
    return this.cabecalhosConhecidos.includes(primeiraCelula);
  }

  prepareData(data) {
    const linhas = data.filter(linha => Array.isArray(linha) && linha[0] !== undefined);
    const semCabecalho =
      linhas.length > 0 && this.isCabecalho(linhas[0]) ? linhas.slice(1) : linhas;

    return semCabecalho
      .map(linha => ({
        titulo: String(linha[0] ?? '').trim(),
        descricao: linha[1] === undefined || linha[1] === null ? null : String(linha[1]).trim()
      }))
      .filter(conteudo => conteudo.titulo.length > 0)
      .map((conteudo, indice) => ({ ...conteudo, ordem: indice + 1 }));
  }

  /**
   * Rejeita a planilha inteira em vez de truncar: cortar titulo em silencio
   * deixaria o cronograma com conteudo errado sem ninguem perceber.
   */
  validarConteudos(conteudos) {
    if (conteudos.length === 0) {
      return { valido: false, chave: 'conteudosLivro.upload.empty' };
    }

    if (conteudos.length > this.maxConteudos) {
      return { valido: false, chave: 'conteudosLivro.upload.too_many' };
    }

    const invalido = conteudos.find(
      conteudo =>
        conteudo.titulo.length > this.maxCaracteresTitulo ||
        (conteudo.descricao && conteudo.descricao.length > this.maxCaracteresDescricao)
    );

    if (invalido) {
      return { valido: false, chave: 'conteudosLivro.upload.line_too_long', linha: invalido.ordem };
    }

    return { valido: true };
  }

  /**
   * Devolve as ordens que a planilha removeria e que ja tem aula concluida ou
   * de escolha manual apontando para elas, ou null quando a troca e segura.
   */
  async getConteudosComHistorico(idLivro, quantidadeNova) {
    const removidos = await GetConteudosAcimaDaOrdemService.handle(idLivro, quantidadeNova);

    if (!removidos || removidos.length === 0) {
      return null;
    }

    const aulas = await GetAulasCongeladasPorConteudosService.handle(
      removidos.map(conteudo => conteudo.id)
    );

    if (!aulas || aulas.length === 0) {
      return null;
    }

    const idsComHistorico = new Set(aulas.map(aula => aula.idConteudo));

    return {
      ordens: removidos
        .filter(conteudo => idsComHistorico.has(conteudo.id))
        .map(conteudo => conteudo.ordem)
        .join(', ')
    };
  }

  async execute() {
    const caminho = this.req.file?.path;

    try {
      const idLivro = this.req.validatedId || this.req.params.id;
      const livro = await GetLivroService.handle(idLivro);

      if (!livro) {
        return this.res.status(404).json({
          message: this.req.t('livros.get.not_found')
        });
      }

      const conteudos = this.prepareData(this.getXLSXDataByFile(caminho));
      const validacao = this.validarConteudos(conteudos);

      if (!validacao.valido) {
        return this.res.status(422).json({
          message: this.req.t(validacao.chave, {
            max: this.maxConteudos,
            linha: validacao.linha
          })
        });
      }

      const bloqueio = await this.getConteudosComHistorico(idLivro, conteudos.length);

      if (bloqueio) {
        return this.res.status(409).json({
          message: this.req.t('conteudosLivro.upload.historico_bloqueia', {
            ordens: bloqueio.ordens
          }),
          ordensBloqueadas: bloqueio.ordens
        });
      }

      const { count } = await SubstituirConteudosLivroService.handle(idLivro, conteudos);
      const { contratosResequenciados } =
        await ResequenciarCronogramasDoLivroService.handle(idLivro);

      const salvos = await GetConteudoLivroListService.handle({ idLivro });

      return this.res.status(200).json({
        count,
        contratosResequenciados,
        data: salvos
      });
    } catch (error) {
      return this.handleError(error, 'conteudosLivro.upload.error');
    } finally {
      await this.removerArquivoTemporario(caminho);
    }
  }

  /**
   * A planilha vai para o diretorio temporario do multer. Removida apos o uso
   * para nao acumular arquivo com dado da escola no disco do servidor.
   */
  async removerArquivoTemporario(caminho) {
    if (!caminho) return;

    try {
      await fs.unlink(caminho);
    } catch {
      // Arquivo temporario ausente ou ja removido nao invalida a importacao.
    }
  }

  static async handle(req, res) {
    const controller = new UploadConteudoLivroExcelController(req, res);
    await controller.execute();
  }
}
