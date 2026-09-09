import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

/**
 * Conteudos que ocupam ordem acima de um limite. Sao exatamente os que uma
 * planilha menor removeria na reimportacao.
 */
export class GetConteudosAcimaDaOrdemService extends AbstractService {
  constructor(Repository, idLivro, limite) {
    super(Repository);
    this.idLivro = idLivro;
    this.limite = limite;
  }

  async execute() {
    return await this.repository.selectAcimaDaOrdem(this.idLivro, this.limite);
  }

  static async handle(idLivro, limite) {
    const Repository = ConteudoLivroRepository;
    const service = new GetConteudosAcimaDaOrdemService(Repository, idLivro, limite);
    return await service.execute();
  }
}
