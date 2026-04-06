export function getNomeCompleto(entity) {
  if (!entity) {
    return '';
  }

  return entity.nomeCompleto
    ? entity.nomeCompleto
    : `${entity.nome || ''} ${entity.sobrenome || ''}`;
}
