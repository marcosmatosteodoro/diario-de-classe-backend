import { getWhereClauseByQuerySearch } from '../../../src/utilities/getWhereClauseByQuerySearch.js';

describe('getWhereClauseByQuerySearch', () => {
  describe('Funcionalidade básica', () => {
    test('deve criar query OR com um campo', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'João',
        fields: ['nome']
      });

      expect(result).toEqual({
        OR: [
          {
            nome: {
              contains: 'João'
            }
          }
        ]
      });
    });

    test('deve criar query OR com múltiplos campos', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'Silva',
        fields: ['nome', 'sobrenome']
      });

      expect(result).toEqual({
        OR: [
          {
            nome: {
              contains: 'Silva'
            }
          },
          {
            sobrenome: {
              contains: 'Silva'
            }
          }
        ]
      });
    });

    test('deve criar query OR com três campos', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: ['nome', 'email', 'telefone']
      });

      expect(result).toEqual({
        OR: [
          {
            nome: {
              contains: 'test'
            }
          },
          {
            email: {
              contains: 'test'
            }
          },
          {
            telefone: {
              contains: 'test'
            }
          }
        ]
      });
    });
  });

  describe('Casos de uso práticos', () => {
    test('deve funcionar com busca de usuários', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'admin',
        fields: ['nome', 'sobrenome', 'email']
      });

      expect(result).toEqual({
        OR: [
          { nome: { contains: 'admin' } },
          { sobrenome: { contains: 'admin' } },
          { email: { contains: 'admin' } }
        ]
      });
    });

    test('deve funcionar com query numérica como string', () => {
      const result = getWhereClauseByQuerySearch({
        query: '123',
        fields: ['id', 'telefone', 'codigo']
      });

      expect(result).toEqual({
        OR: [
          { id: { contains: '123' } },
          { telefone: { contains: '123' } },
          { codigo: { contains: '123' } }
        ]
      });
    });

    test('deve funcionar com query vazia', () => {
      const result = getWhereClauseByQuerySearch({
        query: '',
        fields: ['nome', 'email']
      });

      expect(result).toEqual({
        OR: [{ nome: { contains: '' } }, { email: { contains: '' } }]
      });
    });

    test('deve funcionar com caracteres especiais', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'user@domain.com',
        fields: ['email']
      });

      expect(result).toEqual({
        OR: [{ email: { contains: 'user@domain.com' } }]
      });
    });

    test('deve funcionar com acentos e caracteres especiais', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'José María',
        fields: ['nome']
      });

      expect(result).toEqual({
        OR: [{ nome: { contains: 'José María' } }]
      });
    });
  });

  describe('Estrutura de dados', () => {
    test('deve sempre retornar objeto com propriedade OR', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: ['campo']
      });

      expect(result).toHaveProperty('OR');
      expect(Array.isArray(result.OR)).toBe(true);
    });

    test('deve retornar array OR com mesmo tamanho do array fields', () => {
      const fields = ['campo1', 'campo2', 'campo3', 'campo4'];
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields
      });

      expect(result.OR).toHaveLength(fields.length);
    });

    test('deve criar objeto correto para cada campo', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'busca',
        fields: ['nome', 'email']
      });

      result.OR.forEach((condition, index) => {
        const fieldName = ['nome', 'email'][index];
        expect(condition).toHaveProperty(fieldName);
        expect(condition[fieldName]).toHaveProperty('contains', 'busca');
      });
    });
  });

  describe('Casos extremos', () => {
    test('deve funcionar com array de fields vazio', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: []
      });

      expect(result).toEqual({
        OR: []
      });
    });

    test('deve funcionar com query null', () => {
      const result = getWhereClauseByQuerySearch({
        query: null,
        fields: ['nome']
      });

      expect(result).toEqual({
        OR: [{ nome: { contains: null } }]
      });
    });

    test('deve funcionar com query undefined', () => {
      const result = getWhereClauseByQuerySearch({
        query: undefined,
        fields: ['nome']
      });

      expect(result).toEqual({
        OR: [{ nome: { contains: undefined } }]
      });
    });

    test('deve funcionar com campos com nomes especiais', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: ['campo_com_underscore', 'campoComCamelCase', 'campo-com-hifen']
      });

      expect(result).toEqual({
        OR: [
          { campo_com_underscore: { contains: 'test' } },
          { campoComCamelCase: { contains: 'test' } },
          { 'campo-com-hifen': { contains: 'test' } }
        ]
      });
    });

    test('deve funcionar com query muito longa', () => {
      const longQuery = 'a'.repeat(1000);
      const result = getWhereClauseByQuerySearch({
        query: longQuery,
        fields: ['nome']
      });

      expect(result).toEqual({
        OR: [{ nome: { contains: longQuery } }]
      });
    });

    test('deve funcionar com muitos campos', () => {
      const manyFields = Array.from({ length: 50 }, (_, i) => `campo${i}`);
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: manyFields
      });

      expect(result.OR).toHaveLength(50);
      manyFields.forEach((field, index) => {
        expect(result.OR[index]).toEqual({
          [field]: { contains: 'test' }
        });
      });
    });
  });

  describe('Compatibilidade com Prisma', () => {
    test('deve gerar estrutura compatível com Prisma where clause', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'João',
        fields: ['nome', 'email']
      });

      // Verifica se a estrutura é compatível com Prisma
      expect(result).toMatchObject({
        OR: expect.arrayContaining([
          expect.objectContaining({
            nome: expect.objectContaining({
              contains: expect.any(String)
            })
          }),
          expect.objectContaining({
            email: expect.objectContaining({
              contains: expect.any(String)
            })
          })
        ])
      });
    });

    test('deve usar sempre "contains" como operador de busca', () => {
      const result = getWhereClauseByQuerySearch({
        query: 'test',
        fields: ['campo1', 'campo2', 'campo3']
      });

      result.OR.forEach(condition => {
        const fieldName = Object.keys(condition)[0];
        expect(condition[fieldName]).toHaveProperty('contains');
        expect(Object.keys(condition[fieldName])).toEqual(['contains']);
      });
    });
  });

  describe('Validação de parâmetros de entrada', () => {
    test('deve funcionar com parâmetros corretos', () => {
      expect(() => {
        getWhereClauseByQuerySearch({
          query: 'test',
          fields: ['nome']
        });
      }).not.toThrow();
    });

    test('deve funcionar quando chamado com destructuring', () => {
      const params = {
        query: 'busca',
        fields: ['nome', 'email']
      };

      const result = getWhereClauseByQuerySearch(params);

      expect(result).toEqual({
        OR: [{ nome: { contains: 'busca' } }, { email: { contains: 'busca' } }]
      });
    });
  });

  describe('Consistency e Performance', () => {
    test('deve retornar resultado consistente para mesmos parâmetros', () => {
      const params = {
        query: 'test',
        fields: ['nome', 'email']
      };

      const result1 = getWhereClauseByQuerySearch(params);
      const result2 = getWhereClauseByQuerySearch(params);

      expect(result1).toEqual(result2);
    });

    test('deve ser uma função pura (sem efeitos colaterais)', () => {
      const originalFields = ['nome', 'email'];
      const fieldsCopy = [...originalFields];

      getWhereClauseByQuerySearch({
        query: 'test',
        fields: originalFields
      });

      expect(originalFields).toEqual(fieldsCopy);
    });
  });
});
