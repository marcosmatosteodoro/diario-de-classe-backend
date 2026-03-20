import { jest } from '@jest/globals';
import { UpdateDiaAulaService } from '../../../../src/services/diaAula/updateDiaAulaService.js';
import DiaAulaRepository from '../../../../src/repositories/diaAulaRepository.js';

describe('UpdateDiaAulaService', () => {
  let updateSpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new DiaAulaRepository();
    updateSpy = jest.spyOn(DiaAulaRepository.prototype, 'update');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve instanciar corretamente com id e dados', () => {
    const data = {
      quantidadeAulas: 3
    };
    const service = new UpdateDiaAulaService(DiaAulaRepository, 1, data);
    expect(service).toBeInstanceOf(UpdateDiaAulaService);
    expect(service.id).toBe(1);
    expect(service.data).toEqual(data);
    expect(service.repository).toBeInstanceOf(DiaAulaRepository);
  });

  it('deve atualizar um dia de aula com dados parciais', async () => {
    const id = 1;
    const data = {
      quantidadeAulas: 3,
      horaFinal: '11:00'
    };

    const updatedDiaAula = {
      id,
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'segunda',
      ...data,
      duracaoAula: 60,
      horaInicial: '08:00',
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    updateSpy.mockResolvedValue(updatedDiaAula);

    const result = await UpdateDiaAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        quantidadeAulas: 3,
        horaFinal: '11:00'
      }),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );

    expect(result).toEqual(updatedDiaAula);
  });

  it('deve remover campos undefined antes de atualizar', async () => {
    const id = 1;
    const data = {
      quantidadeAulas: 2,
      horaInicial: undefined,
      diaSemana: undefined
    };

    updateSpy.mockResolvedValue({});

    await UpdateDiaAulaService.handle(id, data);

    const callArgs = updateSpy.mock.calls[0];
    const updateData = callArgs[1];

    expect(updateData).not.toHaveProperty('horaInicial');
    expect(updateData).not.toHaveProperty('diaSemana');
    expect(updateData.quantidadeAulas).toBe(2);
  });

  it('deve atualizar múltiplos campos', async () => {
    const id = 1;
    const data = {
      idAluno: 2,
      diaSemana: 'terça',
      quantidadeAulas: 4,
      duracaoAula: 90,
      horaInicial: '09:00',
      horaFinal: '11:30'
    };

    updateSpy.mockResolvedValue({});

    await UpdateDiaAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith(
      { id },
      expect.objectContaining({
        idAluno: 2,
        diaSemana: 'terça',
        quantidadeAulas: 4,
        duracaoAula: 90,
        horaInicial: '09:00',
        horaFinal: '11:30'
      }),
      expect.any(Object)
    );
  });

  it('deve chamar repository.update com id correto', async () => {
    const id = 123;
    const data = { quantidadeAulas: 2 };

    updateSpy.mockResolvedValue({});

    await UpdateDiaAulaService.handle(id, data);

    expect(updateSpy).toHaveBeenCalledWith({ id: 123 }, expect.any(Object), expect.any(Object));
  });

  it('deve chamar repository.update com selectFields corretos', async () => {
    const id = 1;
    const data = { quantidadeAulas: 1 };

    updateSpy.mockResolvedValue({});

    const service = new UpdateDiaAulaService(DiaAulaRepository, id, data);
    await service.execute();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );
  });

  it('deve manter dados não atualizados intactos', async () => {
    const id = 1;
    const data = {
      quantidadeAulas: 5
    };

    const originalData = {
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'quarta',
      duracaoAula: 60,
      horaInicial: '14:00',
      horaFinal: '15:00'
    };

    updateSpy.mockResolvedValue({ id, ...originalData, ...data });

    await UpdateDiaAulaService.handle(id, data);

    const callArgs = updateSpy.mock.calls[0];
    const updateData = callArgs[1];

    expect(updateData.idAluno).toBeUndefined();
    expect(updateData.idContrato).toBeUndefined();
    expect(updateData.diaSemana).toBeUndefined();
    expect(updateData.quantidadeAulas).toBe(5);
  });

  it('deve lançar erro se repository não for fornecido', () => {
    expect(() => new UpdateDiaAulaService(undefined, 1, {})).toThrow();
  });
});
