import { jest } from '@jest/globals';
import { setImmediate } from 'node:timers';
import { estadoDeSessao } from './estadoDeSessao.js';

const VIDA_PADRAO_MS = 3600 * 1000;

/**
 * Armazenamento de sessões vivo no escopo do teste, fora do grafo de módulos do app: sobrevive a
 * `jest.resetModules()` + novo `import` do app, como o banco sobrevive a um processo novo.
 * O relógio (`relogioMs`, com milissegundos) é do registro falso: só `avancarRelogio` o move,
 * como o `NOW()` do banco é independente do relógio do processo.
 * @returns {{
 *   sessoes: Map<string, object>,
 *   relogioMs: number,
 *   barreira: object|null,
 *   liberacoes: number[],
 *   gancho: Function|null,
 *   avancarRelogio: (segundos: number) => void
 * }}
 */
export const criarArmazenamentoExterno = () => {
  const armazenamento = {
    sessoes: new Map(),
    relogioMs: Date.now(),
    barreira: null,
    liberacoes: [],
    gancho: null,
    avancarRelogio: segundos => {
      armazenamento.relogioMs += segundos * 1000;
    }
  };
  return armazenamento;
};

const novaSessao = (armazenamento, dados) => ({
  idUsuario: dados.idUsuario,
  jtiAtual: dados.jtiAtual ?? 'jti-atual-de-teste',
  jtiAnterior: dados.jtiAnterior ?? null,
  encerrada: dados.encerrada ?? false,
  expiraEmMs: armazenamento.relogioMs + (dados.vidaMs ?? VIDA_PADRAO_MS),
  rotacionadaEmMs: armazenamento.relogioMs
});

export const semearSessao = (armazenamento, { sid, ...dados }) => {
  armazenamento.sessoes.set(sid, novaSessao(armazenamento, dados));
};

/**
 * Barreira no `lerEstado`: as `quantidade` próximas leituras fotografam o estado na chegada e só
 * retornam quando as `quantidade` já leram — força o intercalamento que `Promise.all` contra
 * dublê síncrono não força. `ordemDeLiberacao` permuta os índices de chegada (padrão: ordem de
 * chegada): a liberação ocorre num turno seguinte ao da última chegada, na ordem pedida, e a ordem
 * efetiva fica em `armazenamento.liberacoes`. A barreira vale uma vez, as releituras seguintes
 * passam livres.
 */
export const armarBarreiraDeLeitura = (armazenamento, quantidade, ordemDeLiberacao) => {
  armazenamento.barreira = {
    quantidade,
    ordem: ordemDeLiberacao ?? Array.from({ length: quantidade }, (_, i) => i),
    chegadas: []
  };
};

/**
 * Gancho de uso único entre a leitura e a escrita: roda depois de `lerEstado` fotografar o estado
 * e antes de a leitura retornar, então a escrita seguinte vê o mundo já alterado (sessão
 * encerrada, relógio além de `expiraEm`) com o estado velho na mão do chamador.
 */
export const armarGanchoEntreLeituraEEscrita = (armazenamento, gancho) => {
  armazenamento.gancho = gancho;
};

const aguardarBarreira = async armazenamento => {
  const barreira = armazenamento.barreira;
  if (!barreira) return;
  const indice = barreira.chegadas.length;
  const liberacao = new Promise(resolver => barreira.chegadas.push({ indice, resolver }));
  if (barreira.chegadas.length === barreira.quantidade) {
    armazenamento.barreira = null;
    // Fora da chamada do último a chegar: a continuação dele não ganha a vez só por ter liberado.
    setImmediate(() => {
      for (const posicao of barreira.ordem) {
        armazenamento.liberacoes.push(posicao);
        barreira.chegadas[posicao].resolver();
      }
    });
  }
  await liberacao;
};

/**
 * Instala, no repository do app **atual** (importado depois do último `resetModules`), um registro
 * falso de `criar`, `lerEstado`, `rotacionar`, `substituirSucessor` e `encerrar` sobre o
 * armazenamento. Cada escrita é atômica por chamada (sem `await` entre a checagem e a mudança): o
 * primeiro a escrever vence e o perdedor recebe `null` (zero linhas). Chamar de novo após cada
 * `resetModules` + import do app.
 * @returns {Promise<Object>} os espiões de cada método
 */
export const instalarRegistroFalso = async armazenamento => {
  const { default: SessaoLoginRepository } = await import(
    '../../src/repositories/sessaoLoginRepository.js'
  );
  const { default: Constants } = await import('../../src/utilities/constants.js');
  const prototipo = SessaoLoginRepository.prototype;

  const ativa = sessao => !sessao.encerrada && sessao.expiraEmMs > armazenamento.relogioMs;
  const restante = sessao => ({
    expiraEmEpoch: Math.floor(sessao.expiraEmMs / 1000),
    restanteSegundos: Math.max(Math.ceil((sessao.expiraEmMs - armazenamento.relogioMs) / 1000), 0)
  });
  const retorno = sessao => ({
    jtiAtual: sessao.jtiAtual,
    jtiAnterior: sessao.jtiAnterior,
    ...restante(sessao)
  });

  const criar = jest
    .spyOn(prototipo, 'criar')
    .mockImplementation(async ({ idUsuario, jtiAtual }) => {
      const sid = `c${String(armazenamento.sessoes.size + 1).padStart(24, '0')}`;
      armazenamento.sessoes.set(sid, novaSessao(armazenamento, { idUsuario, jtiAtual }));
      return { id: sid };
    });

  const lerEstado = jest.spyOn(prototipo, 'lerEstado').mockImplementation(async sid => {
    const sessao = armazenamento.sessoes.get(sid);
    const foto = sessao
      ? estadoDeSessao(sessao.idUsuario, {
          jtiAtual: sessao.jtiAtual,
          jtiAnterior: sessao.jtiAnterior,
          encerrada: sessao.encerrada,
          ativa: ativa(sessao),
          dentroDaTolerancia:
            armazenamento.relogioMs - sessao.rotacionadaEmMs <=
            Constants.sessionRotationGraceSeconds * 1000,
          ...restante(sessao)
        })
      : null;
    await aguardarBarreira(armazenamento);
    const gancho = armazenamento.gancho;
    if (gancho) {
      armazenamento.gancho = null;
      gancho(armazenamento);
    }
    return foto;
  });

  const rotacionar = jest
    .spyOn(prototipo, 'rotacionar')
    .mockImplementation(async (sid, apresentado, novoJti) => {
      const sessao = armazenamento.sessoes.get(sid);
      if (!sessao || !ativa(sessao) || sessao.jtiAtual !== apresentado) return null;
      sessao.jtiAnterior = sessao.jtiAtual;
      sessao.jtiAtual = novoJti;
      sessao.rotacionadaEmMs = armazenamento.relogioMs;
      return retorno(sessao);
    });

  const substituirSucessor = jest
    .spyOn(prototipo, 'substituirSucessor')
    .mockImplementation(async (sid, apresentado, jtiAtualLido, novoJti) => {
      const sessao = armazenamento.sessoes.get(sid);
      if (
        !sessao ||
        !ativa(sessao) ||
        sessao.jtiAnterior !== apresentado ||
        sessao.jtiAtual !== jtiAtualLido
      ) {
        return null;
      }
      sessao.jtiAtual = novoJti;
      sessao.rotacionadaEmMs = armazenamento.relogioMs;
      return retorno(sessao);
    });

  const encerrar = jest.spyOn(prototipo, 'encerrar').mockImplementation(async sid => {
    const sessao = armazenamento.sessoes.get(sid);
    if (!sessao || sessao.encerrada) return false;
    sessao.encerrada = true;
    return true;
  });

  return { criar, lerEstado, rotacionar, substituirSucessor, encerrar };
};
