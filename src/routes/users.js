import express from 'express';
import prisma from '../db/prisma.js';

const router = express.Router();

// GET /api/users - Buscar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        dataCriacao: true,
        dataAtualizacao: true
        // Não retornamos a senha por segurança
      }
    });

    res.status(200).json({
      message: req.t('users.list.success'),
      data: users,
      count: users.length,
      language: req.language || 'pt'
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      message: req.t('users.list.error'),
      error: error.message
    });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({
        message: req.t('users.create.validation'),
        errors: {
          email: !email ? req.t('users.create.email_required') : null,
          senha: !senha ? req.t('users.create.password_required') : null
        }
      });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        message: req.t('users.create.email_exists')
      });
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        senha // Em produção, hash a senha com bcrypt
      },
      select: {
        id: true,
        email: true,
        dataCriacao: true,
        dataAtualizacao: true
        // Não retornamos a senha
      }
    });

    res.status(201).json({
      message: req.t('users.create.success'),
      data: user,
      language: req.language || 'pt'
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    // Erro de constraint (email único)
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: req.t('users.create.email_exists')
      });
    }

    res.status(500).json({
      message: req.t('users.create.error'),
      error: error.message
    });
  }
});

export default router;
