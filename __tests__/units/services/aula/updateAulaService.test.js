import { jest } from '@jest/globals';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

describe('UpdateAulaService', () => {
  let updateSpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new AulaRepository();
    updateSpy = jest.spyOn(AulaRepository.prototype, 'update');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve instanciar corretamente com id e dados', () => {
    const data = {
      idAluno: 1,
      status: 'inativa'
    };
    const service = new UpdateAulaService(AulaRepository, 1, data);
    expect(service).toBeInstanceOf(UpdateAulaService);
    expect(service.id).toBe(1);
    expect(service.data).toEqual(data);
    expect(service.repository).toBeInstanceOf(AulaRepository);
  });

  it('deve atualizar uma aula com dados parciais', async () => {
    const id = 1;
    const data = {
      status: 'concluida',
      observacao: 'aula atualizada'
    };

    const updatedAula = {
      id,
      idAluno: 1,
      idProfessor: 1,
      idContrato: 1,
      dataAula: '2023-01-01',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'presencial',
      ...data,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    updateSpy.mockResolvedValue(updatedAula);

    const result = await UpdateAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        status: 'concluida',
        observacao: 'aula atualizada'
      }),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );

    expect(result).toEqual(updatedAula);
  });

  it('deve remover campos undefined antes de atualizar', async () => {
    const id = 1;
    const data = {
      status: 'concluida',
      observacao: undefined,
      idAluno: undefined
    };

    updateSpy.mockResolvedValue({});

    await UpdateAulaService.handle(id, data);

    const callArgs = updateSpy.mock.calls[0];
    const updateData = callArgs[1];

    expect(updateData).not.toHaveProperty('observacao');
    expect(updateData).not.toHaveProperty('idAluno');
    expect(updateData.status).toBe('concluida');
  });

  it('deve atualizar múltiplos campos', async () => {
    const id = 1;
    const data = {
      idAluno: 2,
      idProfessor: 3,
      horaInicial: '09:00',
      horaFinal: '10:00',
      duracaoAula: 90,
      status: 'remarcada'
    };

    updateSpy.mockResolvedValue({});

    await UpdateAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith(
      { id },
      expect.objectContaining({
        idAluno: 2,
        idProfessor: 3,
        horaInicial: '09:00',
        horaFinal: '10:00',
        duracaoAula: 90,
        status: 'remarcada'
      }),
      expect.any(Object)
    );
  });

  it('deve chamar repository.update com id correto', async () => {
    const id = 123;
    const data = { status: 'ativa' };

    updateSpy.mockResolvedValue({});

    await UpdateAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith({ id: 123 }, expect.any(Object), expect.any(Object));
  });

  it('deve chamar repository.update com selectFields corretos', async () => {
    const id = 1;
    const data = { status: 'ativa' };

    updateSpy.mockResolvedValue({});

    const service = new UpdateAulaService(AulaRepository, id, data);
    await service.execute();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );
  });

  it('deve lançar erro se repository não for fornecido', () => {
    expect(() => new UpdateAulaService(undefined, 1, {})).toThrow();
  });
});
