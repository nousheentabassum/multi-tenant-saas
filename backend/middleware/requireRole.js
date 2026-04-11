module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {

    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "No role found in token"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden — insufficient role"
      });
    }

    next();
  };
};
