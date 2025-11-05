export class BaseValidateEntity {
  constructor(req, res, next) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.dataForFilter = this.getDataForFilter();
  }

  getDataForFilter() {
    throw new Error('Método getDataForFilter() deve ser implementado na subclasse');
  }

  getDataValidations(filteredData) {
    throw new Error('Método getDataValidations() deve ser implementado na subclasse', filteredData);
  }

  handle() {
    try {
      if (!this.req.body) {
        return this.res.status(400).json({
          message: this.req.t ? this.req.t('validation.noData') : 'Dados não fornecidos'
        });
      }

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

      // Se há erros de validação
      if (erros.length > 0) {
        return this.res.status(422).json({
          message: this.req.t ? this.req.t('validation.error') : 'Erro de validação',
          errors: erros
        });
      }

      this.req.validatedData = filteredData;

      return this.next();
    } catch (error) {
      return this.res.status(500).json({
        message: this.req.t ? this.req.t('error.internal') : 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}
