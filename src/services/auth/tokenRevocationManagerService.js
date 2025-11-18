class TokenRevocationManager {
  constructor() {
    this.revokedTokens = new Set();
  }

  revoke(token) {
    this.revokedTokens.add(token);
  }

  isRevoked(token) {
    return this.revokedTokens.has(token);
  }

  clear() {
    this.revokedTokens.clear();
  }

  getCount() {
    return this.revokedTokens.size;
  }
}

export default new TokenRevocationManager(); // singleton
