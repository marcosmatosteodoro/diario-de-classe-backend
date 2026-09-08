import { UploadConteudoLivroExcelController } from '../../../../src/controllers/conteudoLivro/uploadConteudoLivroExcelController.js';

/**
 * Cobre a leitura da planilha (prepareData) e os limites (validarConteudos),
 * que é a parte da importação que não depende de banco nem de arquivo.
 */
describe('UploadConteudoLivroExcelController', () => {
  let controller;

  beforeEach(() => {
    const req = { params: { id: 'livro-1' }, body: {}, t: key => key };
    const res = { status: () => res, json: () => res };
    controller = new UploadConteudoLivroExcelController(req, res);
  });

  describe('prepareData', () => {
    it('usa a coluna A como título e a coluna B como descrição', () => {
      const conteudos = controller.prepareData([
        ['Unit 1', 'Greetings'],
        ['Unit 2', 'Numbers']
      ]);

      expect(conteudos).toEqual([
        { ordem: 1, titulo: 'Unit 1', descricao: 'Greetings' },
        { ordem: 2, titulo: 'Unit 2', descricao: 'Numbers' }
      ]);
    });

    it('descarta a linha de cabeçalho da planilha', () => {
      const conteudos = controller.prepareData([
        ['Título', 'Descrição'],
        ['Unit 1', 'Greetings']
      ]);

      expect(conteudos).toEqual([{ ordem: 1, titulo: 'Unit 1', descricao: 'Greetings' }]);
    });

    it('numera a ordem pela posição, ignorando linhas vazias', () => {
      const conteudos = controller.prepareData([['Unit 1'], ['   '], ['Unit 2'], [''], ['Unit 3']]);

      expect(conteudos.map(conteudo => [conteudo.ordem, conteudo.titulo])).toEqual([
        [1, 'Unit 1'],
        [2, 'Unit 2'],
        [3, 'Unit 3']
      ]);
    });

    it('aceita conteúdo sem descrição', () => {
      expect(controller.prepareData([['Unit 1']])).toEqual([
        { ordem: 1, titulo: 'Unit 1', descricao: null }
      ]);
    });

    it('converte número em texto, para planilha com título numérico', () => {
      expect(controller.prepareData([[1, 2]])).toEqual([{ ordem: 1, titulo: '1', descricao: '2' }]);
    });
  });

  describe('validarConteudos', () => {
    it('recusa planilha sem nenhum conteúdo', () => {
      expect(controller.validarConteudos([])).toEqual({
        valido: false,
        chave: 'conteudosLivro.upload.empty'
      });
    });

    it('recusa planilha acima do limite de conteúdos', () => {
      const conteudos = Array.from({ length: 501 }, (_, indice) => ({
        ordem: indice + 1,
        titulo: `Unit ${indice + 1}`,
        descricao: null
      }));

      expect(controller.validarConteudos(conteudos)).toEqual({
        valido: false,
        chave: 'conteudosLivro.upload.too_many'
      });
    });

    it('recusa a planilha inteira e aponta a linha do título longo demais', () => {
      const conteudos = [
        { ordem: 1, titulo: 'Unit 1', descricao: null },
        { ordem: 2, titulo: 'x'.repeat(256), descricao: null }
      ];

      expect(controller.validarConteudos(conteudos)).toEqual({
        valido: false,
        chave: 'conteudosLivro.upload.line_too_long',
        linha: 2
      });
    });

    it('aceita planilha dentro dos limites', () => {
      expect(
        controller.validarConteudos([{ ordem: 1, titulo: 'Unit 1', descricao: 'ok' }])
      ).toEqual({ valido: true });
    });
  });
});
