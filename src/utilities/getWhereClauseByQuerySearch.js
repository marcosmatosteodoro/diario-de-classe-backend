export function getWhereClauseByQuerySearch({ query, fields }) {
  return {
    OR: fields.map(field => ({ [field]: { contains: query } }))
  };
}
