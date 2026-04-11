const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 150,

  keyGenerator: (req) => {
    // Only use tenantId — no IP fallback
    return req.user?.tenantId?.toString() || "global";
  },

  message: {
    message: "Too many requests for this tenant"
  }
});

