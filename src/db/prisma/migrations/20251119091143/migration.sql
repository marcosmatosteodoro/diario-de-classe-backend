-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idDoAluno" TEXT NOT NULL,
    "dataDeInicio" DATETIME NOT NULL,
    "dataDeTermino" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "totalAulas" INTEGER NOT NULL,
    "totalAulasFeitas" INTEGER NOT NULL,
    "totalReposicoes" INTEGER NOT NULL,
    "totalFaltas" INTEGER NOT NULL,
    "totalAulasCanceladas" INTEGER NOT NULL,
    CONSTRAINT "contratos_idDoAluno_fkey" FOREIGN KEY ("idDoAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dias_aula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "diaDaSemana" TEXT NOT NULL,
    "quantidadeDeAulas" INTEGER NOT NULL,
    "horaDeInicio" TEXT NOT NULL,
    "horaDeFim" TEXT NOT NULL,
    CONSTRAINT "dias_aula_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dias_aula_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
