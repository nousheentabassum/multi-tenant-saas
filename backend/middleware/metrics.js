const metrics = {
  totalRequests: 0,
  errorCount: 0,
  tenants: {}
};

function metricsMw(req, res, next) {
  res.on("finish", () => {
    metrics.totalRequests++;

    const t = req.user?.tenantId || "unknown";
    metrics.tenants[t] = (metrics.tenants[t] || 0) + 1;

    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });

  next();
}

module.exports = metricsMw;
module.exports.metrics = metrics;
