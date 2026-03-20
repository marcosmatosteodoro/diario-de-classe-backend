import { jest } from '@jest/globals';
import { CreateDiaAulaService } from '../../../../src/services/diaAula/createDiaAulaService.js';
import DiaAulaRepository from '../../../../src/repositories/diaAulaRepository.js';

describe('CreateDiaAulaService', () => {
  let createSpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new DiaAulaRepository();
    createSpy = jest.spyOn(DiaAulaRepository.prototype, 'create');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve instanciar corretamente com dados', () => {
    const data = {
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'segunda',
      quantidadeAulas: 2,
      duracaoAula: 60,
      horaInicial: '08:00',
      horaFinal: '10:00'
    };
    const service = new CreateDiaAulaService(DiaAulaRepository, data);
    expect(service).toBeInstanceOf(CreateDiaAulaService);
    expect(service.data).toEqual(data);
    expect(service.repository).toBeInstanceOf(DiaAulaRepository);
  });

  it('deve criar um dia de aula com todos os campos', async () => {
    const data = {
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'segunda',
      quantidadeAulas: 2,
      duracaoAula: 60,
      horaInicial: '08:00',
      horaFinal: '10:00'
    };

    const createdDiaAula = {
      id: 1,
      ...data,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    createSpy.mockResolvedValue(createdDiaAula);

    const result = await CreateDiaAulaService.handle(data);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        idAluno: 1,
        idContrato: 1,
        diaSemana: 'segunda',
        quantidadeAulas: 2,
        duracaoAula: 60,
        horaInicial: '08:00',
        horaFinal: '10:00'
      }),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );

    expect(result).toEqual(createdDiaAula);
  });

  it('deve chamar repository.create com selectFields corretos', async () => {
    const data = {
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'terça',
      quantidadeAulas: 1,
      duracaoAula: 45,
      horaInicial: '14:00',
      horaFinal: '14:45'
    };

    createSpy.mockResolvedValue({});

    const service = new CreateDiaAulaService(DiaAulaRepository, data);
    await service.execute();

    expect(createSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );
  });

  it('deve executar com dados mínimos', async () => {
    const data = {
      idAluno: 1,
      idContrato: 1,
      diaSemana: 'quarta',
      quantidadeAulas: 1,
      duracaoAula: 60,
      horaInicial: '18:00',
      horaFinal: '19:00'
    };

    createSpy.mockResolvedValue({});

    const result = await CreateDiaAulaService.handle(data);

    expect(createSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('deve lançar erro se repository não for fornecido', () => {
    const data = { idAluno: 1 };
    expect(() => new CreateDiaAulaService(undefined, data)).toThrow();
  });

  it('deve preservar todos os campos de entrada', async () => {
    const data = {
      idAluno: 5,
      idContrato: 3,
      diaSemana: 'sexta',
      quantidadeAulas: 3,
      duracaoAula: 90,
      horaInicial: '19:00',
      horaFinal: '21:30'
    };

    createSpy.mockResolvedValue({});

    await CreateDiaAulaService.handle(data);

    const callArgs = createSpy.mock.calls[0];
    const createData = callArgs[0];

    expect(createData.idAluno).toBe(5);
    expect(createData.idContrato).toBe(3);
    expect(createData.diaSemana).toBe('sexta');
    expect(createData.quantidadeAulas).toBe(3);
    expect(createData.duracaoAula).toBe(90);
    expect(createData.horaInicial).toBe('19:00');
    expect(createData.horaFinal).toBe('21:30');
  });
});
