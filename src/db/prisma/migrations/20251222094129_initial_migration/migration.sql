-- CreateEnum
CREATE TYPE "Permissao" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "DiaDaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoAula" AS ENUM ('PADRAO', 'REPOSICAO', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusAula" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'CANCELADA_POR_FALTA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senha" TEXT NOT NULL,
    "resetarSenha" BOOLEAN NOT NULL DEFAULT false,
    "permissao" "Permissao" NOT NULL DEFAULT 'member',
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidades_professor" (
    "id" TEXT NOT NULL,
    "diaSemana" "DiaDaSemana" NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidades_professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "material" TEXT,
    "criador" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "duracaoAula" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_funcionamento" (
    "id" TEXT NOT NULL,
    "diaSemana" "DiaDaSemana" NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracaoId" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dias_funcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "idAluno" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataTermino" TIMESTAMP(3),
    "status" "StatusContrato" NOT NULL,
    "totalAulas" INTEGER NOT NULL,
    "totalAulasFeitas" INTEGER NOT NULL,
    "totalReposicoes" INTEGER NOT NULL,
    "totalFaltas" INTEGER NOT NULL,
    "totalAulasCanceladas" INTEGER NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_aula" (
    "id" TEXT NOT NULL,
    "idAluno" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "diaSemana" "DiaDaSemana" NOT NULL,
    "quantidadeAulas" INTEGER NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dias_aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL,
    "idAluno" TEXT NOT NULL,
    "idProfessor" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "dataAula" TIMESTAMP(3) NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "tipo" "TipoAula" NOT NULL,
    "status" "StatusAula" NOT NULL,
    "observacao" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_email_key" ON "alunos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_idAluno_idProfessor_idContrato_dataAula_key" ON "aulas"("idAluno", "idProfessor", "idContrato", "dataAula");

-- AddForeignKey
ALTER TABLE "disponibilidades_professor" ADD CONSTRAINT "disponibilidades_professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_funcionamento" ADD CONSTRAINT "dias_funcionamento_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "configuracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_aula" ADD CONSTRAINT "dias_aula_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_aula" ADD CONSTRAINT "dias_aula_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_idProfessor_fkey" FOREIGN KEY ("idProfessor") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
