import DisponibilidadeProfessorRepository from '../../../src/repositories/disponibilidadeProfessorRepository.js';

describe('DisponibilidadeProfessorRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new DisponibilidadeProfessorRepository();
  });

  test('deve instanciar corretamente', () => {
    expect(repo).toBeInstanceOf(DisponibilidadeProfessorRepository);
    expect(repo.entity).toBeDefined();
  });

  test('deve ter método getEntity', () => {
    expect(typeof repo.getEntity).toBe('function');
    expect(repo.getEntity()).toBeDefined();
  });

  test('deve ter método getSelectFields', () => {
    expect(typeof repo.getSelectFields).toBe('function');
    expect(repo.getSelectFields()).toBeDefined();
  });

  test('deve ter propriedade selectFields definida', () => {
    expect(repo.selectFields).toBeDefined();
    expect(typeof repo.selectFields).toBe('object');
  });

  test('deve herdar de AbstractRepository (métodos CRUD)', () => {
    expect(typeof repo.selectMany).toBe('function');
    expect(typeof repo.selectOne).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
  });

  test('selectOne deve lançar erro quando where não é fornecido', async () => {
    await expect(repo.selectOne({})).rejects.toThrow('Condições de busca (where) são obrigatórias');
  });

  test('getSelectFields deve retornar os mesmos campos que selectFields', () => {
    expect(repo.getSelectFields()).toEqual(repo.selectFields);
  });

  test('selectFields deve conter campos corretos', () => {
    const f = repo.selectFields;
    expect(f.id).toBe(true);
    expect(f.diaSemana).toBe(true);
    expect(f.horaInicial).toBe(true);
    expect(f.horaFinal).toBe(true);
    expect(f.ativo).toBe(true);
    expect(f.userId).toBe(true);
  });
});
