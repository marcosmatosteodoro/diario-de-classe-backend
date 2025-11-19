/*
  Warnings:

  - Added the required column `dataAtualizacao` to the `configuracoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataAtualizacao` to the `contratos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataAtualizacao` to the `dias_aula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataAtualizacao` to the `dias_funcionamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataAtualizacao` to the `disponibilidades_professor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracaoDaAula" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL
);
INSERT INTO "new_configuracoes" ("duracaoDaAula", "id", "tolerancia") SELECT "duracaoDaAula", "id", "tolerancia" FROM "configuracoes";
DROP TABLE "configuracoes";
ALTER TABLE "new_configuracoes" RENAME TO "configuracoes";
CREATE TABLE "new_contratos" (
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
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "contratos_idDoAluno_fkey" FOREIGN KEY ("idDoAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contratos" ("dataDeInicio", "dataDeTermino", "id", "idDoAluno", "status", "totalAulas", "totalAulasCanceladas", "totalAulasFeitas", "totalFaltas", "totalReposicoes") SELECT "dataDeInicio", "dataDeTermino", "id", "idDoAluno", "status", "totalAulas", "totalAulasCanceladas", "totalAulasFeitas", "totalFaltas", "totalReposicoes" FROM "contratos";
DROP TABLE "contratos";
ALTER TABLE "new_contratos" RENAME TO "contratos";
CREATE TABLE "new_dias_aula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "diaDaSemana" TEXT NOT NULL,
    "quantidadeDeAulas" INTEGER NOT NULL,
    "horaDeInicio" TEXT NOT NULL,
    "horaDeFim" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "dias_aula_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dias_aula_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dias_aula" ("diaDaSemana", "horaDeFim", "horaDeInicio", "id", "idAluno", "idContrato", "quantidadeDeAulas") SELECT "diaDaSemana", "horaDeFim", "horaDeInicio", "id", "idAluno", "idContrato", "quantidadeDeAulas" FROM "dias_aula";
DROP TABLE "dias_aula";
ALTER TABLE "new_dias_aula" RENAME TO "dias_aula";
CREATE TABLE "new_dias_funcionamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaDaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracaoId" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "dias_funcionamento_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "configuracoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dias_funcionamento" ("ativo", "configuracaoId", "diaDaSemana", "horaFinal", "horaInicial", "id") SELECT "ativo", "configuracaoId", "diaDaSemana", "horaFinal", "horaInicial", "id" FROM "dias_funcionamento";
DROP TABLE "dias_funcionamento";
ALTER TABLE "new_dias_funcionamento" RENAME TO "dias_funcionamento";
CREATE TABLE "new_disponibilidades_professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaDaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "disponibilidades_professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_disponibilidades_professor" ("ativo", "diaDaSemana", "horaFinal", "horaInicial", "id", "userId") SELECT "ativo", "diaDaSemana", "horaFinal", "horaInicial", "id", "userId" FROM "disponibilidades_professor";
DROP TABLE "disponibilidades_professor";
ALTER TABLE "new_disponibilidades_professor" RENAME TO "disponibilidades_professor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
