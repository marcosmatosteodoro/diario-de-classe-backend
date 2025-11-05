import { ValidateData } from '../utilities/validateData.js';

/**
 * Middleware para validar dados de criação de usuário
 * Valida apenas o campo nome
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateCreateUser = (req, res, next) => {
  try {
    const { nome, sobrenome, email, telefone, senha, resetarSenha, permissao } = req.body;

    // Validar campo nome
    const nomeValidation = ValidateData.require()
      .isString()
      .minCharacters(3)
      .maxCharacters(200)
      .validate(nome, 'nome');

    // Validar campo sobrenome
    const sobrenomeValidation = ValidateData.require()
      .isString()
      .minCharacters(3)
      .maxCharacters(200)
      .validate(sobrenome, 'sobrenome');

    // Validar campo email
    const emailValidation = ValidateData.require().isEmail().validate(email, 'email');

    // Validar campo telefone
    const telefoneValidation = ValidateData.optional()
      .isString()
      .minCharacters(10)
      .maxCharacters(11)
      .validate(telefone, 'telefone');

    // Validar campo senha
    const senhaValidation = ValidateData.require()
      .isString()
      .minCharacters(6)
      .maxCharacters(200)
      // .isPassword()
      .validate(senha, 'senha');

    // Validar campo resetarSenha
    const resetarSenhaValidation = ValidateData.optional()
      .isBoolean()
      .validate(resetarSenha, 'resetarSenha');

    // Validar campo permissao
    const permissaoValidation = ValidateData.optional()
      .isString()
      .isEnum(['member', 'admin'])
      .validate(permissao, 'permissao');

    // Se há erros de validação
    if (
      !nomeValidation.isValid ||
      !sobrenomeValidation.isValid ||
      !emailValidation.isValid ||
      !telefoneValidation.isValid ||
      !senhaValidation.isValid ||
      !resetarSenhaValidation.isValid ||
      !permissaoValidation.isValid
    ) {
      return res.status(422).json({
        message: req.t ? req.t('validation.error') : 'Erro de validação',
        errors: [
          ...nomeValidation.errors,
          ...sobrenomeValidation.errors,
          ...emailValidation.errors,
          ...telefoneValidation.errors,
          ...senhaValidation.errors,
          ...resetarSenhaValidation.errors,
          ...permissaoValidation.errors
        ]
      });
    }

    req.validatedData = { nome };

    // Se validação passou, continua para próximo middleware
    return next();
  } catch (error) {
    return res.status(500).json({
      message: req.t ? req.t('error.internal') : 'Erro interno do servidor',
      error: error.message
    });
  }
};
