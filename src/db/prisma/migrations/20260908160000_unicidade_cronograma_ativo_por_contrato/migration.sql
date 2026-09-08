-- Garante no banco a invariante de "um livro ativo por contrato".
--
-- A aplicacao ja abre o cronograma novo desativando o anterior na mesma
-- transacao, mas isso protegia apenas aquele caminho: um PUT /cronogramas/:id
-- com { "ativo": true } reativava um cronograma antigo e deixava dois ativos no
-- mesmo contrato. Com dois ativos, o GetCronogramaAtivoService passa a devolver
-- um dos dois conforme o plano de execucao e o resequenciador alterna de livro.
--
-- Indice parcial nao e representavel no schema.prisma, entao vive so aqui.
-- Verificado que `prisma migrate diff` nao propoe remove-lo.
CREATE UNIQUE INDEX "cronogramas_aluno_idContrato_ativo_key"
  ON "cronogramas_aluno" ("idContrato")
  WHERE ativo;
