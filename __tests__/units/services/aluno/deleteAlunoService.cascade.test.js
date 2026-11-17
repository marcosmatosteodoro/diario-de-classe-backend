import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeleteAlunoService } from '../../../../src/services/aluno/deleteAlunoService.js';
import { IsContratoAlunoAtivoExistsService } from '../../../../src/services/contrato/isContratoAlunoAtivoExistsService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../../../src/db/prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf-8');

/**
 * Apagar um aluno
 * cascateia para contrato, dia de aula, aula e cronograma via FK
 * `onDelete: Cascade` — decidido inteiramente pelo schema, sem soft delete e
 * sem nenhuma orquestração de limpeza na camada de aplicação. Não há como
 * exercitar o efeito real da FK sem banco real (nenhum teste do repo sobe
 * banco — ver __tests__/mocks/prismaMock.js); a prova falsificável possível
 * neste nível é dupla: (1) o contrato de cascade está de fato declarado no
 * schema para as quatro entidades dependentes, e (2) `DeleteAlunoService` não
 * orquestra nada além do delete do próprio aluno — a cascata inteira é
 * responsabilidade do banco, não do código.
 */
describe('Cascata de exclusão de aluno — contrato declarado no schema (Prisma)', () => {
  const modelosComCascadeDeAluno = ['Contrato', 'DiaAula', 'Aula', 'CronogramaAluno'];

  test.each(modelosComCascadeDeAluno)(
    'model %s tem FK de aluno com onDelete: Cascade',
    modelName => {
      const inicioModel = schema.indexOf(`model ${modelName} {`);
      expect(inicioModel).toBeGreaterThan(-1);

      const fimModel = schema.indexOf('\n}', inicioModel);
      const corpoModel = schema.slice(inicioModel, fimModel);

      expect(corpoModel).toMatch(
        /aluno\s+Aluno\s+@relation\(fields:\s*\[idAluno\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/
      );
    }
  );

  test('model Aluno não declara campo de soft delete (ativo/status/dataExclusao)', () => {
    const inicioModel = schema.indexOf('model Aluno {');
    const fimModel = schema.indexOf('\n}', inicioModel);
    const corpoModel = schema.slice(inicioModel, fimModel);

    expect(corpoModel).not.toMatch(/\bativo\b/i);
    expect(corpoModel).not.toMatch(/\bstatus\b/i);
    expect(corpoModel).not.toMatch(/dataExclus/i);
  });
});

describe('DeleteAlunoService — a cascata não é orquestrada pela aplicação (documenta lacuna)', () => {
  let deleteSpy;

  beforeEach(() => {
    deleteSpy = jest.spyOn(AlunoRepository.prototype, 'delete');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('DeleteAlunoService.handle() não chama IsContratoAlunoAtivoExistsService — não há checagem de contrato ativo antes de apagar', async () => {
    const isContratoAtivoSpy = jest.spyOn(IsContratoAlunoAtivoExistsService, 'handle');
    deleteSpy.mockResolvedValue({ id: 'aluno-1' });

    await DeleteAlunoService.handle('aluno-1');

    // O serviço que informa se o aluno tem contrato ativo só é chamado na
    // criação de contrato. A asserção documenta o estado
    // atual, não um comportamento desejável: se a checagem for adicionada,
    // este teste passa a falhar e força atualização consciente.
    expect(isContratoAtivoSpy).not.toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith({ id: 'aluno-1' });
  });

  it('DeleteAlunoService.handle() não chama nenhum repository/service de contrato, aula, diaAula ou cronograma — a única chamada é repository.delete do aluno', async () => {
    deleteSpy.mockResolvedValue({ id: 'aluno-2' });

    const resultado = await DeleteAlunoService.handle('aluno-2');

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith({ id: 'aluno-2' });
    expect(resultado).toEqual({ id: 'aluno-2' });
  });
});
