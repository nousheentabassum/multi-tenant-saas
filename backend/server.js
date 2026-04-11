const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test" && !process.env.JWT_SECRET) {
  logger.warn("JWT_SECRET is not set. Auth will fail. Set it in .env");
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
