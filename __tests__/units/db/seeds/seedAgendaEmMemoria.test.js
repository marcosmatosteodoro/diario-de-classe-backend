import { seedAgendaEmMemoria } from '../../../mocks/seedAgendaEmMemoria.js';

const dia = ymd => new Date(`${ymd}T00:00:00.000Z`);

const SELECT = {
  id: true,
  idAluno: false,
  dataAula: true,
  horaInicial: true,
  horaFinal: true,
  tipo: true,
  status: true,
  aluno: { select: { nome: true } },
  professor: { select: { nome: true } }
};

const alunos = [{ id: 'al1', nome: 'Aluno Um' }];
const professores = [
  { id: 'p1', nome: 'Prof Um' },
  { id: 'p2', nome: 'Prof Dois' }
];
const base = { idAluno: 'al1', horaInicial: '08:00', horaFinal: '08:40', tipo: 'PADRAO' };
const aulas = [
  { ...base, id: 'a1', idProfessor: 'p1', dataAula: dia('2026-11-19'), status: 'CONCLUIDA' },
  { ...base, id: 'a2', idProfessor: 'p1', dataAula: dia('2026-11-20'), status: 'AGENDADA' },
  { ...base, id: 'a3', idProfessor: 'p2', dataAula: dia('2026-11-20'), status: 'AGENDADA' }
];

describe('seedAgendaEmMemoria', () => {
  const fake = seedAgendaEmMemoria({ aulas, alunos, professores });
  const ids = async where => (await fake.findMany({ where, select: SELECT })).map(a => a.id);
  const intervalo = (inicio, fim) => ({
    gte: new Date(`${inicio}T00:00:00.000Z`),
    lte: new Date(`${fim}T23:59:59.999Z`)
  });

  test('dataAula: devolve só as do intervalo, com limites inclusivos', async () => {
    expect(await ids({ dataAula: intervalo('2026-11-20', '2026-11-20') })).toEqual(['a2', 'a3']);
    expect(await ids({ dataAula: intervalo('2026-11-19', '2026-11-19') })).toEqual(['a1']);
    expect(await ids({ dataAula: intervalo('2026-11-19', '2026-11-20') })).toEqual([
      'a1',
      'a2',
      'a3'
    ]);
    expect(await ids({ dataAula: intervalo('2026-11-21', '2026-11-22') })).toEqual([]);
  });

  test('idProfessor e status filtram', async () => {
    expect(await ids({ idProfessor: 'p2' })).toEqual(['a3']);
    expect(await ids({ status: 'CONCLUIDA' })).toEqual(['a1']);
    expect(await ids({ idProfessor: 'p1', status: 'AGENDADA' })).toEqual(['a2']);
  });

  test('o resultado traz exatamente as chaves do select do controller', async () => {
    const [primeira] = await fake.findMany({ where: { idProfessor: 'p2' }, select: SELECT });

    expect(Object.keys(primeira).sort()).toEqual(
      ['id', 'dataAula', 'horaInicial', 'horaFinal', 'tipo', 'status', 'aluno', 'professor'].sort()
    );
    expect(primeira.aluno).toEqual({ nome: 'Aluno Um' });
    expect(primeira.professor).toEqual({ nome: 'Prof Dois' });
  });

  test('chave de where fora do conjunto rejeita; sem ela a mesma chamada resolve', async () => {
    await expect(fake.findMany({ where: { tipo: 'PADRAO' }, select: SELECT })).rejects.toThrow();
    await expect(
      fake.findMany({ where: { dataAula: { gt: dia('2026-11-19') } }, select: SELECT })
    ).rejects.toThrow();
    await expect(fake.findMany({ where: {}, select: SELECT })).resolves.toHaveLength(3);
  });
});
