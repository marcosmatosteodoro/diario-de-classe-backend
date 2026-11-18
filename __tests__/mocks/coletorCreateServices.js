import { jest } from '@jest/globals';
import { cuid } from './accessDeTeste.js';
import { CreateUserService } from '../../src/services/user/createUserService.js';
import { CreateDisponibilidadeProfessorService } from '../../src/services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';
import { CreateAlunoService } from '../../src/services/aluno/createAlunoService.js';
import { CreateContratoService } from '../../src/services/contrato/createContratoService.js';
import { CreateDiaAulaService } from '../../src/services/diaAula/createDiaAulaService.js';
import { CreateAulaService } from '../../src/services/aula/createAulaService.js';
import { CreateLivroService } from '../../src/services/livro/createLivroService.js';

const SERVICES = {
  usuario: CreateUserService,
  disponibilidade: CreateDisponibilidadeProfessorService,
  aluno: CreateAlunoService,
  contrato: CreateContratoService,
  diaAula: CreateDiaAulaService,
  aula: CreateAulaService,
  livro: CreateLivroService
};

/**
 * Espia o `handle(data)` dos 7 `Create*Service` do seed: devolve `{ id, ...data }` com id no
 * formato cuid, guarda os argumentos por tipo e deixa passar ao `handle` original os tipos
 * listados em `reais`.
 * @param {{ reais?: string[] }} [opcoes] tipos (chaves de `spies`) que não são dublados
 * @returns {{ argumentos: Record<string, object[]>, spies: Record<string, import('@jest/globals').jest.SpiedFunction>, restaurar: () => void }}
 */
export function coletarCreateServices({ reais = [] } = {}) {
  const argumentos = {};
  const spies = {};

  for (const [tipo, Service] of Object.entries(SERVICES)) {
    argumentos[tipo] = [];
    const original = Service.handle;
    spies[tipo] = jest.spyOn(Service, 'handle').mockImplementation(async data => {
      argumentos[tipo].push(data);
      if (reais.includes(tipo)) return original.call(Service, data);
      return { id: cuid(`${tipo}${argumentos[tipo].length}`), ...data };
    });
  }

  return {
    argumentos,
    spies,
    restaurar: () => Object.values(spies).forEach(spy => spy.mockRestore())
  };
}
