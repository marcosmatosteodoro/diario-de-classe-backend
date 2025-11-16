-- CreateTable
CREATE TABLE "disponibilidades_professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaDaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    CONSTRAINT "disponibilidades_professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracaoDaAula" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL,
    "diasDeFuncionamento" TEXT NOT NULL,
    CONSTRAINT "configuracoes_diasDeFuncionamento_fkey" FOREIGN KEY ("diasDeFuncionamento") REFERENCES "dias_funcionamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dias_funcionamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaDaSemana" TEXT NOT NULL,
    "horaInicial" TEXT NOT NULL,
    "horaFinal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
