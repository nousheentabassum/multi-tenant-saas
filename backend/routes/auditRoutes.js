const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const AuditLog = require("../models/AuditLog");

router.get("/", auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { tenantId: req.user.tenantId };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
    res.status(500).json({ message: "Failed to load audit logs" });
  }
});

module.exports = router;
