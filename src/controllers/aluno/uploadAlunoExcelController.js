import fs from 'fs';
import XLSX from 'xlsx';
import AbstractController from '../abstractController.js';
import AlunoRepository from '../../repositories/alunoRepository.js';
import { CreateAlunoService } from '../../services/aluno/createAlunoService.js';
import { UpdateAlunoService } from '../../services/aluno/updateAlunoService.js';
import { GetAlunoListController } from './getAlunoListController.js';
import LoggerManager from '../../utilities/loggerManager.js';

export class UploadAlunoExcelController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  getXLSXDataByFile(file) {
    // Lê o arquivo Excel
    const workbook = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
    // Pega a primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Converte para JSON sem cabeçalho (header: 1 retorna array de arrays)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return data;
  }

  prepareData(data) {
    const processedData = data
      .filter(row => row[0] && row[1]) // Filtra linhas com ambas as colunas preenchidas
      .map(row => {
        const fullName = row[0];
        const fullNameArray = fullName.split(' ');
        const nome = fullNameArray[0];
        const sobrenome = fullNameArray.length > 1 ? fullNameArray.slice(1).join(' ') : '';
        const email = row[1];
        const criador = this.req.user.sub || null;
        return {
          nome,
          sobrenome,
          email,
          criador
        };
      });

    // Remove duplicatas baseadas em nome, sobrenome, email e criador
    const uniqueData = [];
    const seenKeys = new Set();

    for (const item of processedData) {
      const key = `${item.nome}|${item.sobrenome}|${item.email}|${item.criador}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueData.push(item);
      }
    }

    return uniqueData;
  }

  isThereRepeatedEmail(data) {
    const emailSet = new Set();
    for (const [index, row] of data.entries()) {
      const email = row.email;
      if (emailSet.has(email)) {
        LoggerManager.warn('aluno.upload.email_duplicado', { linha: index + 1 });
        return true; // Email repetido encontrado
      }
      emailSet.add(email);
    }
    return false; // Nenhum email repetido encontrado
  }

  getPromises(data) {
    return data.map(async aluno => {
      const { nome, sobrenome, email } = aluno;
      const alunoRepository = new AlunoRepository();
      const currentAluno = await alunoRepository.selectOne({
        where: { email },
        select: alunoRepository.selectFields
      });
      return !currentAluno
        ? CreateAlunoService.handle(aluno)
        : UpdateAlunoService.handle(currentAluno.id, {
            ...currentAluno,
            nome,
            sobrenome,
            email
          });
    });
  }

  async execute() {
    try {
      const file = this.req.file.path;
      // Lê o arquivo Excel
      const fileData = this.getXLSXDataByFile(file);
      const data = this.prepareData(fileData);

      if (this.isThereRepeatedEmail(data)) {
        return this.res.status(400).json({
          message: this.req.t('alunos.upload.repeated_emails')
        });
      }
      const promises = this.getPromises(data);
      await Promise.all(promises);
      return GetAlunoListController.handle(this.req, this.res);
    } catch (error) {
      return this.handleError(error, 'alunos.upload.error');
    }
  }

  static async handle(req, res) {
    const controller = new UploadAlunoExcelController(req, res);
    await controller.execute();
  }
}
