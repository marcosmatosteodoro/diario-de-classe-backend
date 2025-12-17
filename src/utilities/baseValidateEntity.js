export class BaseValidateEntity {
  constructor(req, res, next, isArray = false) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.dataForFilter = this.getDataForFilter();
    this.isArray = isArray;
  }

  getDataForFilter() {
    throw new Error('Método getDataForFilter() deve ser implementado na subclasse');
  }

  getDataValidations(filteredData) {
    throw new Error('Método getDataValidations() deve ser implementado na subclasse', filteredData);
  }

  filterDataItem(item) {
    return Object.keys(item)
      .filter(key => this.dataForFilter.includes(key))
      .reduce((obj, key) => {
        obj[key] = item[key];
        return obj;
      }, {});
  }

  validateBodyIsArray() {
    if (!Array.isArray(this.req.body)) {
      return {
        isValid: false,
        error: {
          message: this.req.t ? this.req.t('validation.error') : 'Erro de validação',
          errors: ['O corpo da requisição deve ser um array']
        }
      };
    }

    if (this.req.body.length === 0) {
      return {
        isValid: false,
        error: {
          message: this.req.t ? this.req.t('validation.error') : 'Erro de validação',
          errors: ['O array não pode estar vazio']
        }
      };
    }

    return { isValid: true };
  }

  validateAllItems() {
    const validatedDataArray = [];
    const allErrors = [];

    this.req.body.forEach((item, index) => {
      const filteredData = this.filterDataItem(item);
      const dataValidations = this.getDataValidations(filteredData, index);

      const errors = Object.values(dataValidations)
        .filter(validation => !validation.isValid)
        .flatMap(validation => validation.errors);

      if (errors.length > 0) {
        allErrors.push(...errors);
      } else {
        validatedDataArray.push(filteredData);
      }
    });

    return { validatedDataArray, allErrors };
  }

  handleArrayValidation() {
    const arrayValidation = this.validateBodyIsArray();
    if (!arrayValidation.isValid) {
      return this.res.status(400).json(arrayValidation.error);
    }

    const { validatedDataArray, allErrors } = this.validateAllItems();

    if (allErrors.length > 0) {
      return this.res.status(422).json({
        message: this.req.t ? this.req.t('validation.error') : 'Erro de validação',
        errors: allErrors
      });
    }

    this.req.validatedData = validatedDataArray;
    return this.next();
  }

  handleSingleValidation() {
    const filteredData = Object.keys(this.req.body)
      .filter(key => this.dataForFilter.includes(key))
      .reduce((obj, key) => {
        obj[key] = this.req.body[key];
        return obj;
      }, {});

    const dataValidations = this.getDataValidations(filteredData);

    const erros = Object.values(dataValidations)
      .filter(validation => !validation.isValid)
      .flatMap(validation => validation.errors);

    if (erros.length > 0) {
      return this.res.status(422).json({
        message: this.req.t ? this.req.t('validation.error') : 'Erro de validação',
        errors: erros
      });
    }

    this.req.validatedData = filteredData;
    return this.next();
  }

  handle() {
    try {
      if (!this.req.body) {
        return this.res.status(400).json({
          message: this.req.t ? this.req.t('validation.noData') : 'Dados não fornecidos'
        });
      }

      if (this.isArray) {
        return this.handleArrayValidation();
      }

      return this.handleSingleValidation();
    } catch (error) {
      return this.res.status(500).json({
        message: this.req.t ? this.req.t('error.internal') : 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}
