-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contratos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idDoAluno" TEXT NOT NULL,
    "dataDeInicio" DATETIME,
    "dataDeTermino" DATETIME,
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
INSERT INTO "new_contratos" ("dataAtualizacao", "dataCriacao", "dataDeInicio", "dataDeTermino", "id", "idDoAluno", "status", "totalAulas", "totalAulasCanceladas", "totalAulasFeitas", "totalFaltas", "totalReposicoes") SELECT "dataAtualizacao", "dataCriacao", "dataDeInicio", "dataDeTermino", "id", "idDoAluno", "status", "totalAulas", "totalAulasCanceladas", "totalAulasFeitas", "totalFaltas", "totalReposicoes" FROM "contratos";
DROP TABLE "contratos";
ALTER TABLE "new_contratos" RENAME TO "contratos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
