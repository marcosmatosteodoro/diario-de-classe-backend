import { jest } from '@jest/globals';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

describe('CreateAulaService', () => {
  let createSpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new AulaRepository();
    createSpy = jest.spyOn(AulaRepository.prototype, 'create');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve instanciar corretamente com dados', () => {
    const data = {
      idAluno: 1,
      idProfessor: 1,
      idContrato: 1,
      dataAula: '2023-01-01',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'presencial',
      status: 'ativa',
      observacao: 'teste'
    };
    const service = new CreateAulaService(AulaRepository, data);
    expect(service).toBeInstanceOf(CreateAulaService);
    expect(service.data).toEqual(data);
    expect(service.repository).toBeInstanceOf(AulaRepository);
  });

  it('deve criar uma aula com todos os campos', async () => {
    const data = {
      idAluno: 1,
      idProfessor: 2,
      idContrato: 1,
      dataAula: '2023-01-01',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'presencial',
      status: 'ativa',
      observacao: 'observação teste'
    };

    const createdAula = {
      id: 1,
      ...data,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    createSpy.mockResolvedValue(createdAula);

    const result = await CreateAulaService.handle(data);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        idAluno: 1,
        idProfessor: 2,
        idContrato: 1,
        dataAula: '2023-01-01',
        horaInicial: '08:00',
        horaFinal: '09:00',
        duracaoAula: 60,
        tipo: 'presencial',
        status: 'ativa',
        observacao: 'observação teste'
      }),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );

    expect(result).toEqual(createdAula);
  });

  it('deve chamar repository.create com selectFields corretos', async () => {
    const data = {
      idAluno: 1,
      idProfessor: 1,
      idContrato: 1,
      dataAula: '2023-01-01',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'presencial',
      status: 'ativa'
    };

    createSpy.mockResolvedValue({});

    const service = new CreateAulaService(AulaRepository, data);
    await service.execute();

    expect(createSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        select: repoInstance.selectFields
      })
    );
  });

  it('deve executar sem observacao', async () => {
    const data = {
      idAluno: 1,
      idProfessor: 1,
      idContrato: 1,
      dataAula: '2023-01-01',
      horaInicial: '08:00',
      horaFinal: '09:00',
      duracaoAula: 60,
      tipo: 'presencial',
      status: 'ativa'
    };

    createSpy.mockResolvedValue({});

    const result = await CreateAulaService.handle(data);

    expect(createSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('deve lançar erro se repository não for fornecido', () => {
    const data = { idAluno: 1 };
    expect(() => new CreateAulaService(undefined, data)).toThrow();
  });
});
