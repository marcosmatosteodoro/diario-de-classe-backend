import { cuid } from '../../../mocks/accessDeTeste.js';
import { coletarCreateServices } from '../../../mocks/coletorCreateServices.js';
import { CreateUserService } from '../../../../src/services/user/createUserService.js';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';

describe('coletarCreateServices', () => {
  test('gera ids distintos para 200 chamadas por tipo (sem colisão entre n=1, 10 e 100)', async () => {
    const coletor = coletarCreateServices();
    const ids = { usuario: new Set(), aula: new Set() };
    for (let i = 0; i < 200; i++) {
      ids.usuario.add((await CreateUserService.handle({})).id);
      ids.aula.add((await CreateAulaService.handle({})).id);
    }
    coletor.restaurar();

    expect(ids.usuario.size).toBe(200);
    expect(ids.aula.size).toBe(200);
    expect(cuid('usuario0001')).not.toBe(cuid('usuario0010'));
  });
});
