/**
 * Middleware para validar se o usuário é administrador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
export const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: req.t('api.errors.forbidden')
    });
  }
  return next();
};

export default adminOnly;
