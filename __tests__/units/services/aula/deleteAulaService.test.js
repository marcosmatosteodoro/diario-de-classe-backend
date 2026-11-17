import { jest } from '@jest/globals';
import { DeleteAulaService } from '../../../../src/services/aula/deleteAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

/**
 * `DeleteAulaService` é
 * hard delete real — não existe soft delete de aula em lugar nenhum do
 * domínio. Contraste com "cancelar via /andamento" fica em
 * andamentoAulaController.maquinaDeEstados.test.js, que prova que cancelar
 * só muda `status` e preserva o registro.
 */
describe('DeleteAulaService — hard delete real (sem soft delete)', () => {
  let deleteSpy;

  beforeEach(() => {
    deleteSpy = jest.spyOn(AulaRepository.prototype, 'delete');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('remove o registro de verdade via repository.delete — não existe um "status de excluída"', async () => {
    const aulaRemovida = {
      id: 'aula-1',
      idAluno: 'aluno-1',
      idProfessor: 'professor-1',
      idContrato: 'contrato-1',
      status: 'CONCLUIDA'
    };
    deleteSpy.mockResolvedValue(aulaRemovida);

    const resultado = await DeleteAulaService.handle('aula-1');

    // O único efeito é `repository.delete` — nenhuma chamada de update com um
    // status tipo "EXCLUIDA"/"CANCELADA" acontece aqui: é remoção física.
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith({ id: 'aula-1' });
    expect(resultado).toEqual(aulaRemovida);
  });

  it('propaga o erro do repository sem tentar um fallback de soft delete', async () => {
    const erroDeBanco = new Error('Record to delete does not exist');
    deleteSpy.mockRejectedValue(erroDeBanco);

    await expect(DeleteAulaService.handle('aula-inexistente')).rejects.toThrow(
      'Record to delete does not exist'
    );
  });
});
