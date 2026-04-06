import { getNomeCompleto } from '../../../src/utilities/getNomeCompleto';

describe('getNomeCompleto', () => {
  describe('quando entity é nulo ou indefinido', () => {
    it('deve retornar string vazia quando entity é null', () => {
      expect(getNomeCompleto(null)).toBe('');
    });

    it('deve retornar string vazia quando entity é undefined', () => {
      expect(getNomeCompleto(undefined)).toBe('');
    });
  });

  describe('quando entity tem nomeCompleto preenchido', () => {
    it('deve retornar o nomeCompleto quando está preenchido', () => {
      const entity = {
        nome: 'João',
        sobrenome: 'Silva',
        nomeCompleto: 'João da Silva Santos'
      };

      expect(getNomeCompleto(entity)).toBe('João da Silva Santos');
    });

    it('deve retornar nomeCompleto mesmo que nome e sobrenome sejam diferentes', () => {
      const entity = {
        nome: 'João',
        sobrenome: 'Silva',
        nomeCompleto: 'Outro Nome'
      };

      expect(getNomeCompleto(entity)).toBe('Outro Nome');
    });
  });

  describe('quando entity não tem nomeCompleto', () => {
    it('deve concatenar nome e sobrenome quando ambos estão preenchidos', () => {
      const entity = {
        nome: 'João',
        sobrenome: 'Silva'
      };

      expect(getNomeCompleto(entity)).toBe('João Silva');
    });

    it('deve retornar só o nome quando sobrenome está vazio', () => {
      const entity = {
        nome: 'João',
        sobrenome: ''
      };

      expect(getNomeCompleto(entity)).toBe('João ');
    });

    it('deve retornar só o sobrenome quando nome está vazio', () => {
      const entity = {
        nome: '',
        sobrenome: 'Silva'
      };

      expect(getNomeCompleto(entity)).toBe(' Silva');
    });

    it('deve retornar espaço quando ambos são vazios', () => {
      const entity = {
        nome: '',
        sobrenome: ''
      };

      expect(getNomeCompleto(entity)).toBe(' ');
    });

    it('deve retornar espaço quando nome e sobrenome são undefined', () => {
      const entity = {};

      expect(getNomeCompleto(entity)).toBe(' ');
    });
  });

  describe('casos especiais', () => {
    it('deve priorizar nomeCompleto quando ambos existem', () => {
      const entity = {
        nome: 'João',
        sobrenome: 'Silva',
        nomeCompleto: 'J. da S.'
      };

      expect(getNomeCompleto(entity)).toBe('J. da S.');
    });

    it('deve retornar nomeCompleto vazio quando explicitamente definido', () => {
      const entity = {
        nome: 'João',
        sobrenome: 'Silva',
        nomeCompleto: ''
      };

      expect(getNomeCompleto(entity)).toBe('João Silva');
    });

    it('deve lidar com nomes com caracteres especiais', () => {
      const entity = {
        nome: 'José',
        sobrenome: 'São Paulo'
      };

      expect(getNomeCompleto(entity)).toBe('José São Paulo');
    });

    it('deve lidar com nomes com múltiplos espaços', () => {
      const entity = {
        nome: 'João   ',
        sobrenome: '   Silva'
      };

      expect(getNomeCompleto(entity)).toBe('João    ' + '   Silva');
    });
  });
});
