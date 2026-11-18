import { jest } from '@jest/globals';

/**
 * Armazenamento de sessões vivo no escopo do teste, fora do grafo de módulos do app: sobrevive a
 * `jest.resetModules()` + novo `import` do app, como o banco sobrevive a um processo novo.
 * @returns {{ sessoes: Map<string, object> }}
 */
export const criarArmazenamentoExterno = () => ({ sessoes: new Map() });

export const semearSessao = (
  armazenamento,
  { sid, idUsuario, jtiAtual = 'jti-atual-de-teste', encerrada = false }
) => {
  armazenamento.sessoes.set(sid, { idUsuario, jtiAtual, encerrada });
};

/**
 * Instala, no repository do app **atual** (importado depois do último `resetModules`), um registro
 * falso de `criar`, `lerEstado` e `encerrar` sobre o armazenamento. Chamar de novo após cada
 * `resetModules` + import do app.
 * @returns {Promise<{ criar: jest.SpyInstance, lerEstado: jest.SpyInstance, encerrar: jest.SpyInstance }>}
 */
export const instalarRegistroFalso = async armazenamento => {
  const { default: SessaoLoginRepository } = await import(
    '../../src/repositories/sessaoLoginRepository.js'
  );
  const prototipo = SessaoLoginRepository.prototype;

  const criar = jest
    .spyOn(prototipo, 'criar')
    .mockImplementation(async ({ idUsuario, jtiAtual }) => {
      const sid = `c${String(armazenamento.sessoes.size + 1).padStart(24, '0')}`;
      armazenamento.sessoes.set(sid, { idUsuario, jtiAtual, encerrada: false });
      return { id: sid };
    });

  const lerEstado = jest.spyOn(prototipo, 'lerEstado').mockImplementation(async sid => {
    const sessao = armazenamento.sessoes.get(sid);
    if (!sessao) return null;
    return {
      idUsuario: sessao.idUsuario,
      jtiAtual: sessao.jtiAtual,
      jtiAnterior: null,
      encerrada: sessao.encerrada,
      ativa: !sessao.encerrada,
      dentroDaTolerancia: true,
      expiraEmEpoch: Math.floor(Date.now() / 1000) + 3600,
      restanteSegundos: 3600
    };
  });

  const encerrar = jest.spyOn(prototipo, 'encerrar').mockImplementation(async sid => {
    const sessao = armazenamento.sessoes.get(sid);
    if (!sessao || sessao.encerrada) return false;
    sessao.encerrada = true;
    return true;
  });

  return { criar, lerEstado, encerrar };
};
