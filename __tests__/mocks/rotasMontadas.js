import { jest } from '@jest/globals';
import express from 'express';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s): quem chama
// `carregarRotasMontadas` no `beforeAll` passa este teto.
export const TIMEOUT_IMPORT_FRIO = 30000;

const juntar = (prefixo, caminho) => {
  const completo = `${prefixo}/${caminho}`.replace(/\/+/g, '/');
  return completo.length > 1 ? completo.replace(/\/$/, '') : completo;
};

/**
 * Importa `src/app.js` e enumera as rotas montadas, cada uma como `{ verbo, caminho, camadas }`
 * (`camadas` são as funções da pilha da rota). A camada do Express 5 não guarda o caminho de
 * `use`, então os prefixos são capturados em `Router.prototype.use` durante o import.
 * Duplica de propósito a técnica de `inventarioDeRotas.test.js` (DEC-002-006 · demonstracao).
 */
export async function carregarRotasMontadas() {
  const montagens = new Map();
  const useOriginal = express.Router.prototype.use;
  let app;

  express.Router.prototype.use = function (...args) {
    const [primeiro, ...resto] = args;
    const prefixo = typeof primeiro === 'string' ? primeiro : '/';
    for (const fn of (typeof primeiro === 'string' ? resto : args).flat(Infinity)) {
      montagens.set(fn, prefixo);
    }
    return useOriginal.apply(this, args);
  };
  try {
    jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: app } = await import('../../src/app.js'));
  } finally {
    express.Router.prototype.use = useOriginal;
  }

  const enumerar = (router, prefixo = '') => {
    const rotas = [];
    for (const camada of router.stack) {
      if (camada.route) {
        if (typeof camada.route.path !== 'string') {
          throw new Error(`caminho de rota não recuperável: ${String(camada.route.path)}`);
        }
        for (const metodo of Object.keys(camada.route.methods)) {
          rotas.push({
            verbo: metodo.toUpperCase(),
            caminho: juntar(prefixo, camada.route.path),
            camadas: camada.route.stack.map(item => item.handle)
          });
        }
      } else if (Array.isArray(camada.handle?.stack)) {
        if (!montagens.has(camada.handle)) {
          throw new Error('sub-router montado sem prefixo registrado');
        }
        rotas.push(...enumerar(camada.handle, juntar(prefixo, montagens.get(camada.handle))));
      }
    }
    return rotas;
  };

  return { app, rotas: enumerar(app.router) };
}
