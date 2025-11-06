import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateAluno extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['nome', 'sobrenome', 'email', 'telefone', 'criador'];
  }

  getDataValidations(filteredData) {
    const { nome, sobrenome, email, telefone, criador } = filteredData;

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
      // Validar campo criador
      criador: ValidateData.optional()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(criador, 'criador')
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

export const validateCreateAluno = (req, res, next) => {
  const validateCreateAluno = new ValidateCreateAluno(req, res, next);
  return validateCreateAluno.handle();
};
