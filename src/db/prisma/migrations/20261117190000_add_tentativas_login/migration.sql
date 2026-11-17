-- CreateTable
CREATE TABLE "tentativas_login" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "contagem" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tentativas_login_chave_key" ON "tentativas_login"("chave");
