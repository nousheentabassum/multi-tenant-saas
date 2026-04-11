const express = require("express");
const router = express.Router();

const { createProject, getProjects } = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/tenantRateLimit");


const requireRole = require("../middleware/requireRole");

router.use(authMiddleware);
router.use(rateLimit);

router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  createProject
);
router.get("/", getProjects);

module.exports = router;
