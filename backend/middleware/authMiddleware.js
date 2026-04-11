const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
