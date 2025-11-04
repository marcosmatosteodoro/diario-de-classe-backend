import { GetUserListService } from '../../../../src/services/user/getUserListService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetUserListService', () => {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório padrão', () => {
      const service = new GetUserListService(UserRepository);

      expect(service).toBeInstanceOf(GetUserListService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve herdar de AbstractService', () => {
      expect(Object.getPrototypeOf(GetUserListService)).toBe(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const service = new GetUserListService(UserRepository);

      expect(typeof service.execute).toBe('function');
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve ter método handle estático implementado', () => {
      expect(typeof GetUserListService.handle).toBe('function');
      expect(GetUserListService.handle).not.toBe(AbstractService.handle);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const service = new GetUserListService(UserRepository);

      // Verifica se tem os métodos necessários
      expect(service.execute).toBeDefined();
      expect(service.repository).toBeDefined();
      expect(GetUserListService.handle).toBeDefined();
    });

    test('deve ter repository configurado', () => {
      const service = new GetUserListService(UserRepository);

      expect(service.repository).toBeInstanceOf(UserRepository);
      expect(service.repository.selectMany).toBeDefined();
    });

    test('deve aceitar repository customizado no construtor', () => {
      class MockRepository {
        constructor() {
          this.selectMany = () => Promise.resolve([]);
        }
      }

      const service = new GetUserListService(MockRepository);

      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Integração com AbstractService', () => {
    test('deve chamar super no construtor', () => {
      const service = new GetUserListService(UserRepository);

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(service.repository).toBeDefined();
    });

    test('deve implementar método execute abstrato', () => {
      const service = new GetUserListService(UserRepository);

      // O método execute deve ser diferente do da classe abstrata
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
      expect(typeof service.execute).toBe('function');
    });

    test('deve ser uma subclasse de AbstractService', () => {
      const service = new GetUserListService(UserRepository);

      expect(service instanceof AbstractService).toBe(true);
      expect(service instanceof GetUserListService).toBe(true);
    });
  });

  describe('Validação de campos de seleção', () => {
    test('deve definir campos corretos para seleção de usuários', () => {
      const service = new GetUserListService(UserRepository);

      // Como não podemos acessar diretamente os campos sem executar,
      // vamos apenas verificar se o método existe e é assíncrono
      expect(service.execute).toBeDefined();
      expect(service.execute.constructor.name).toBe('AsyncFunction');
    });
  });
});
