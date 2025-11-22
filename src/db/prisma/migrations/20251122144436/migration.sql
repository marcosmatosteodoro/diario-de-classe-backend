-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senha" TEXT NOT NULL,
    "resetarSenha" BOOLEAN NOT NULL DEFAULT false,
    "permissao" TEXT NOT NULL DEFAULT 'member',
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "disponibilidades_professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "disponibilidades_professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "criador" TEXT,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracaoAula" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dias_funcionamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracaoId" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "dias_funcionamento_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "configuracoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "dataInicio" DATETIME,
    "dataTermino" DATETIME,
    "status" TEXT NOT NULL,
    "totalAulas" INTEGER NOT NULL,
    "totalAulasFeitas" INTEGER NOT NULL,
    "totalReposicoes" INTEGER NOT NULL,
    "totalFaltas" INTEGER NOT NULL,
    "totalAulasCanceladas" INTEGER NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "contratos_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dias_aula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "quantidadeAulas" INTEGER NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "dias_aula_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dias_aula_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "idProfessor" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "dataAula" DATETIME NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacao" TEXT,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "aulas_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aulas_idProfessor_fkey" FOREIGN KEY ("idProfessor") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aulas_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_email_key" ON "alunos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_idAluno_idProfessor_idContrato_dataAula_key" ON "aulas"("idAluno", "idProfessor", "idContrato", "dataAula");
