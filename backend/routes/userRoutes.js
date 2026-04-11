const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const rateLimit = require("../middleware/tenantRateLimit");

router.use(auth);
router.use(rateLimit);


/* =========================
   GET CURRENT USER
   GET /api/users/me
========================= */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("tenantId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenantId.name,
      },
    });
  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET USERS IN SAME COMPANY
   GET /api/users/tenant
========================= */
router.get("/tenant", auth, async (req, res) => {
  try {
    const users = await User.find(
      { tenantId: req.user.tenantId },
      "name email role"
    );

    res.json({ users });
  } catch (err) {
    console.error("GET TENANT USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADD USER (ADMIN ONLY)
   POST /api/users
========================= */
router.post("/", auth, async (req, res) => {
  try {
    // 🔐 Only admin can add users
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can add users" });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ❌ Email must be globally unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "MEMBER",
      tenantId: req.user.tenantId, // ✅ SAME COMPANY
    });

    res.status(201).json({
      message: "User added successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("ADD USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
