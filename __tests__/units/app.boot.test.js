import { jest } from '@jest/globals';
import { setTimeout as aguardar } from 'node:timers/promises';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

describe('boot de app.js (unit)', () => {
  let handle;
  let loggerError;

  const importApp = async () => {
    jest.resetModules();
    handle = jest.fn();
    loggerError = jest.fn();

    jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
      InitialSetting: { handle }
    }));
    jest.unstable_mockModule('../../src/utilities/loggerManager.js', () => ({
      default: { error: loggerError, expressLogger: jest.fn(), info: jest.fn() }
    }));
  };

  test(
    'rejeição do setup rejeita o import e registra a causa no log de erro',
    async () => {
      await importApp();
      const causa = new Error('setup indisponivel');
      handle.mockRejectedValue(causa);

      await expect(import('../../src/app.js?rejeita')).rejects.toBe(causa);

      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(loggerError.mock.calls[0][1]).toBe(causa);
    },
    TIMEOUT_IMPORT_FRIO
  );

  test(
    'setup aguardado antes de expor o app: import resolve com o app',
    async () => {
      await importApp();
      let terminou = false;
      handle.mockImplementation(async () => {
        await aguardar(20);
        terminou = true;
      });

      const mod = await import('../../src/app.js?resolve');

      expect(terminou).toBe(true);
      expect(handle).toHaveBeenCalledTimes(1);
      expect(typeof mod.default).toBe('function');
      expect(loggerError).not.toHaveBeenCalled();
    },
    TIMEOUT_IMPORT_FRIO
  );
});
