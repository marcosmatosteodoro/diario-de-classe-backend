import { jest } from '@jest/globals';
import { CreateLivroService } from '../../../../src/services/livro/createLivroService.js';
import LivroRepository from '../../../../src/repositories/livroRepository.js';

describe('CreateLivroService', () => {
  let createSpy;

  beforeEach(() => {
    createSpy = jest.spyOn(LivroRepository.prototype, 'create');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve instanciar corretamente com dados', () => {
    const data = { nome: 'New Interchange 1', idioma: 'INGLES', nivel: 1 };
    const service = new CreateLivroService(LivroRepository, data);

    expect(service).toBeInstanceOf(CreateLivroService);
    expect(service.data).toEqual(data);
    expect(service.repository).toBeInstanceOf(LivroRepository);
  });

  it('deve criar um livro com todos os campos', async () => {
    const data = { nome: 'New Interchange 1', idioma: 'INGLES', nivel: 1, ativo: true };
    createSpy.mockResolvedValue({ id: 'livro-1', ...data });

    const result = await CreateLivroService.handle(data);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'New Interchange 1',
        idioma: 'INGLES',
        nivel: 1,
        ativo: true
      }),
      expect.objectContaining({ select: expect.any(Object) })
    );
    expect(result.id).toBe('livro-1');
  });

  it('deve propagar erro do repositório', async () => {
    createSpy.mockRejectedValue(new Error('falha no banco'));

    await expect(CreateLivroService.handle({ nome: 'X', idioma: 'INGLES' })).rejects.toThrow(
      'falha no banco'
    );
  });
});
