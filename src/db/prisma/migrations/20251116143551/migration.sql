/*
  Warnings:

  - You are about to drop the column `diasDeFuncionamento` on the `configuracoes` table. All the data in the column will be lost.
  - Added the required column `configuracaoId` to the `dias_funcionamento` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracaoDaAula" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL
);
INSERT INTO "new_configuracoes" ("duracaoDaAula", "id", "tolerancia") SELECT "duracaoDaAula", "id", "tolerancia" FROM "configuracoes";
DROP TABLE "configuracoes";
ALTER TABLE "new_configuracoes" RENAME TO "configuracoes";
CREATE TABLE "new_dias_funcionamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaDaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracaoId" TEXT NOT NULL,
    CONSTRAINT "dias_funcionamento_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "configuracoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dias_funcionamento" ("ativo", "diaDaSemana", "horaFinal", "horaInicial", "id") SELECT "ativo", "diaDaSemana", "horaFinal", "horaInicial", "id" FROM "dias_funcionamento";
DROP TABLE "dias_funcionamento";
ALTER TABLE "new_dias_funcionamento" RENAME TO "dias_funcionamento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
