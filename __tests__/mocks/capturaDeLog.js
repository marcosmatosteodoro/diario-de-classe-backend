import { jest } from '@jest/globals';
import util from 'node:util';

const METODOS = ['log', 'info', 'warn', 'error', 'debug'];

/**
 * Captura tudo que o processo escreve em log: console.* e escrita direta em
 * stdout/stderr (logger de query do Prisma). Restaurada por `jest.restoreAllMocks()`.
 */
export const capturarLog = () => {
  const textos = [];
  const spies = METODOS.map(m =>
    jest
      .spyOn(console, m)
      .mockImplementation((...args) =>
        textos.push(
          args.map(a => (typeof a === 'string' ? a : util.inspect(a, { depth: null }))).join(' ')
        )
      )
  );
  for (const fluxo of [process.stdout, process.stderr]) {
    const spy = jest.spyOn(fluxo, 'write').mockImplementation(chunk => {
      textos.push(String(chunk));
      return true;
    });
    spies.push(spy);
  }
  return { textos, spies, texto: () => textos.join('\n') };
};
