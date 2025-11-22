/*
  Warnings:

  - A unique constraint covering the columns `[idAluno,idProfessor,idContrato,dataAula]` on the table `aulas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "aulas_idAluno_idProfessor_idContrato_dataAula_key" ON "aulas"("idAluno", "idProfessor", "idContrato", "dataAula");
