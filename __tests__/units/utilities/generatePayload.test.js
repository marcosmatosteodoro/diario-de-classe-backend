import { generatePayload } from '../../../src/utilities/generatePayload.js';
import Constants from '../../../src/utilities/constants.js';

describe('generatePayload', () => {
  test('devolve exatamente sub, id, email, role e ver', () => {
    const user = { id: 'u-42', email: 'ana@example.com', permissao: 'professor', senha: 'x' };

    expect(generatePayload(user)).toEqual({
      sub: 'u-42',
      id: 'u-42',
      email: 'ana@example.com',
      role: 'professor',
      ver: Constants.accessTokenVersion
    });
    expect(Object.keys(generatePayload(user)).sort()).toEqual([
      'email',
      'id',
      'role',
      'sub',
      'ver'
    ]);
  });
});
