export function generatePayload(user) {
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.permissao
  };
}
