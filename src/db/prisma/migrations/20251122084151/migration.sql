-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idAluno" TEXT NOT NULL,
    "idProfessor" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "dataAula" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacao" TEXT,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    CONSTRAINT "aulas_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aulas_idProfessor_fkey" FOREIGN KEY ("idProfessor") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aulas_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
