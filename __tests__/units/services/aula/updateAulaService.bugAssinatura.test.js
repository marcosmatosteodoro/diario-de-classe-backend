import { jest } from '@jest/globals';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

/**
 * Documenta o defeito descrito na lição
 * "Mock que copia a chamada, e não o contrato, fica verde sobre o bug"
 * (lição do projeto): `UpdateAulaService.handle(id, data)` é uma
 * fronteira de **dois** argumentos, mas três controllers
 * (createContratoController, updateContratoController e
 * createManyAulaController) chamam com um único objeto mesclado
 * (`{ id, ...data }`).
 *
 * Este teste NÃO conserta o bug — ele prova que ele existe hoje. Se algum dia
 * alguém corrigir a assinatura (ou os chamadores) sem atualizar este teste,
 * ele passa a falhar: essa quebra é a intenção, para forçar decisão consciente
 * no dia da correção.
 */
describe('UpdateAulaService — regressão do bug de assinatura (documenta defeito, não corrige)', () => {
  it('quebra quando chamado do jeito que os três controllers chamam hoje (objeto único mesclado)', async () => {
    const chamadaComoOsControllersFazemHoje = {
      id: 'aula-1',
      idAluno: 'aluno-1',
      idProfessor: 'professor-1',
      idContrato: 'contrato-1',
      dataAula: '2025-01-10',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'REGULAR',
      status: 'AGENDADA',
      observacao: 'reconciliação de contrato'
    };

    // handle(id, data): passar só o objeto mesclado faz `id` receber o objeto
    // inteiro e `data` chegar `undefined` — é exatamente o que os três
    // controllers fazem. Este teste espera o estouro, não o sucesso.
    await expect(UpdateAulaService.handle(chamadaComoOsControllersFazemHoje)).rejects.toThrow();
  });

  it('prova a causa: com um único argumento, this.data fica undefined e execute() estoura no primeiro acesso', async () => {
    const objetoMesclado = { id: 'aula-1', idAluno: 'aluno-1', status: 'CONCLUIDA' };

    // Mesma forma que `new UpdateAulaService(Repository, id, data)` recebe
    // quando o chamador só passa o objeto único (data nunca é fornecido).
    const service = new UpdateAulaService(AulaRepository, objetoMesclado, undefined);

    expect(service.data).toBeUndefined();
    await expect(service.execute()).rejects.toThrow(TypeError);
  });

  it('contraste: chamado com os dois argumentos (id, data) — a forma correta — não estoura por causa da assinatura', async () => {
    const updateSpy = jest
      .spyOn(AulaRepository.prototype, 'update')
      .mockResolvedValue({ id: 'aula-1', status: 'CONCLUIDA' });

    await expect(UpdateAulaService.handle('aula-1', { status: 'CONCLUIDA' })).resolves.toEqual({
      id: 'aula-1',
      status: 'CONCLUIDA'
    });

    expect(updateSpy).toHaveBeenCalledWith(
      { id: 'aula-1' },
      expect.objectContaining({ status: 'CONCLUIDA' }),
      expect.any(Object)
    );

    updateSpy.mockRestore();
  });
});
