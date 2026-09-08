-- AlterTable
ALTER TABLE "aulas" ADD COLUMN     "idConteudo" TEXT,
ADD COLUMN     "conteudoManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "livros" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "idioma" "Idioma" NOT NULL,
    "nivel" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos_livro" (
    "id" TEXT NOT NULL,
    "idLivro" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudos_livro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronogramas_aluno" (
    "id" TEXT NOT NULL,
    "idAluno" TEXT NOT NULL,
    "idContrato" TEXT NOT NULL,
    "idLivro" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataConclusao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronogramas_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livros_nome_idioma_key" ON "livros"("nome", "idioma");

-- CreateIndex
CREATE INDEX "conteudos_livro_idLivro_idx" ON "conteudos_livro"("idLivro");

-- CreateIndex
CREATE UNIQUE INDEX "conteudos_livro_idLivro_ordem_key" ON "conteudos_livro"("idLivro", "ordem");

-- CreateIndex
CREATE INDEX "cronogramas_aluno_idAluno_idx" ON "cronogramas_aluno"("idAluno");

-- CreateIndex
CREATE INDEX "cronogramas_aluno_idContrato_idx" ON "cronogramas_aluno"("idContrato");

-- CreateIndex
CREATE INDEX "aulas_idConteudo_idx" ON "aulas"("idConteudo");

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_idConteudo_fkey" FOREIGN KEY ("idConteudo") REFERENCES "conteudos_livro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_livro" ADD CONSTRAINT "conteudos_livro_idLivro_fkey" FOREIGN KEY ("idLivro") REFERENCES "livros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_aluno" ADD CONSTRAINT "cronogramas_aluno_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_aluno" ADD CONSTRAINT "cronogramas_aluno_idContrato_fkey" FOREIGN KEY ("idContrato") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_aluno" ADD CONSTRAINT "cronogramas_aluno_idLivro_fkey" FOREIGN KEY ("idLivro") REFERENCES "livros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
