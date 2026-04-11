const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const logger = require("./utils/logger");
const metricsMw = require("./middleware/metrics");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const rateLimiter = require("./middleware/tenantRateLimit");


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(metricsMw);
app.use("/api", rateLimiter);

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/auditlogs", require("./routes/auditRoutes"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const { metrics } = require("./middleware/metrics");

app.get("/internal/metrics", (req, res) => {
  res.json(metrics);
});

/* ✅ DO NOT CONNECT DB DURING TESTS */
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info("MongoDB connected"))
    .catch((err) => logger.error(err, "MongoDB connection error"));
}

app.use((err, req, res, next) => {
  logger.error(err, "Unhandled error");
  res.status(err.status || 500).json({
    error: err.message || "Server error"
  });
});

module.exports = app;
