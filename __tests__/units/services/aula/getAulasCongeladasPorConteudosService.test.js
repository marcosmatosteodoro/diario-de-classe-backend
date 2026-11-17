import { jest } from '@jest/globals';
import { GetAulasCongeladasPorConteudosService } from '../../../../src/services/aula/getAulasCongeladasPorConteudosService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

// GetAulasCongeladasPorConteudosService é a proteção central contra apagar
// conteúdo com histórico.
describe('GetAulasCongeladasPorConteudosService', () => {
  let selectManySpy;

  beforeEach(() => {
    selectManySpy = jest.spyOn(AulaRepository.prototype, 'selectMany');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('idsConteudo vazio/ausente — curto-circuito sem consultar o banco', () => {
    it('retorna [] e não chama o repository quando idsConteudo é []', async () => {
      const service = new GetAulasCongeladasPorConteudosService(AulaRepository, []);
      const result = await service.execute();

      expect(result).toEqual([]);
      expect(selectManySpy).not.toHaveBeenCalled();
    });

    it('retorna [] e não chama o repository quando idsConteudo é undefined', async () => {
      const service = new GetAulasCongeladasPorConteudosService(AulaRepository, undefined);
      const result = await service.execute();

      expect(result).toEqual([]);
      expect(selectManySpy).not.toHaveBeenCalled();
    });

    it('handle: mesmo curto-circuito pela via estática', async () => {
      const result = await GetAulasCongeladasPorConteudosService.handle([]);

      expect(result).toEqual([]);
      expect(selectManySpy).not.toHaveBeenCalled();
    });
  });

  describe('consulta de vínculo congelado (CONCLUIDA ou conteudoManual)', () => {
    it('monta o where com os dois critérios de congelamento (status CONCLUIDA OU conteudoManual)', async () => {
      selectManySpy.mockResolvedValue([]);

      await GetAulasCongeladasPorConteudosService.handle(['c1', 'c2']);

      expect(selectManySpy).toHaveBeenCalledWith({
        where: {
          idConteudo: { in: ['c1', 'c2'] },
          OR: [{ status: { in: ['CONCLUIDA'] } }, { conteudoManual: true }]
        },
        select: { id: true, idConteudo: true, idContrato: true, status: true }
      });
    });

    it('devolve as aulas com vínculo congelado que o repository resolver', async () => {
      const aulasCongeladas = [
        { id: 'a1', idConteudo: 'c1', idContrato: 'ctr-1', status: 'CONCLUIDA' },
        {
          id: 'a2',
          idConteudo: 'c2',
          idContrato: 'ctr-1',
          status: 'AGENDADA',
          conteudoManual: true
        }
      ];
      selectManySpy.mockResolvedValue(aulasCongeladas);

      const result = await GetAulasCongeladasPorConteudosService.handle(['c1', 'c2']);

      expect(result).toEqual(aulasCongeladas);
    });

    it('não filtra no JS: repassa exatamente o que o repository devolve, sem reaplicar a regra', async () => {
      // Documenta que o service confia inteiramente no `where` que ele mesmo
      // montou (e o Prisma resolve) — não há segunda checagem em memória
      // sobre status/conteudoManual antes de devolver o resultado.
      const aulasVindoDoRepository = [
        { id: 'x', idConteudo: 'c1', idContrato: 'ctr-1', status: 'AGENDADA' }
      ];
      selectManySpy.mockResolvedValue(aulasVindoDoRepository);

      const result = await GetAulasCongeladasPorConteudosService.handle(['c1']);

      expect(result).toBe(aulasVindoDoRepository);
    });
  });
});
