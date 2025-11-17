import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateUser extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['nome', 'sobrenome', 'email', 'telefone', 'senha', 'resetarSenha', 'permissao'];
  }

  getDataValidations(filteredData) {
    const { nome, sobrenome, email, telefone, senha, resetarSenha, permissao } = filteredData;

    return {
      // Validar campo nome
      nome: ValidateData.require()
        .isString()
        .minCharacters(3)
        .maxCharacters(200)
        .validate(nome, 'nome'),
      // Validar campo sobrenome
      sobrenome: ValidateData.require()
        .isString()
        .minCharacters(3)
        .maxCharacters(200)
        .validate(sobrenome, 'sobrenome'),
      // Validar campo email
      email: ValidateData.require().isEmail().maxCharacters(200).validate(email, 'email'),
      // Validar campo telefone
      telefone: ValidateData.optional()
        .isString()
        .minCharacters(10)
        .maxCharacters(11)
        .validate(telefone, 'telefone'),
      // Validar campo senha
      senha: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(200)
        // .isPassword()
        .validate(senha, 'senha'),
      // Validar campo resetarSenha
      resetarSenha: ValidateData.optional().isBoolean().validate(resetarSenha, 'resetarSenha'),
      // Validar campo permissao
      permissao: ValidateData.optional()
        .isString()
        .isEnum(['member', 'admin'])
        .validate(permissao, 'permissao')
    };
  }
}

/**
 * Middleware para validar dados de criação de usuário
 * Valida apenas o campo nome
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */

export const validateCreateUser = (req, res, next) => {
  const validateCreateUser = new ValidateCreateUser(req, res, next);
  return validateCreateUser.handle();
};
