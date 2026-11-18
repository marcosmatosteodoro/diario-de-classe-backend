-- CreateTable
CREATE TABLE "sessoes_login" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "jtiAtual" TEXT NOT NULL,
    "jtiAnterior" TEXT,
    "rotacionadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "encerradaEm" TIMESTAMP(3),
    "motivoEncerramento" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessoes_login_idUsuario_idx" ON "sessoes_login"("idUsuario");

-- AddForeignKey
ALTER TABLE "sessoes_login" ADD CONSTRAINT "sessoes_login_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
