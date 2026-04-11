const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Tenant = require("../models/Tenant");

/* =========================
   TOKEN HELPERS
========================= */
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
};

// REGISTER COMPANY + ADMIN (ONLY ONCE)
router.post("/register", async (req, res) => {
  try {
    const { tenantName, name, email, password } = req.body;

    if (!tenantName || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingTenant = await Tenant.findOne({ name: tenantName });
    if (existingTenant) {
      return res.status(400).json({
        message: "Company already exists. Please login or add user.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const tenant = await Tenant.create({ name: tenantName });

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      tenantId: tenant._id,
    });

    tenant.owner = adminUser._id;
    await tenant.save();

    const accessToken = generateAccessToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    res.status(201).json({
      message: "Company registered successfully",
      token: accessToken,
      refreshToken,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        tenantId: tenant._id,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// REGISTER USER UNDER EXISTING COMPANY
router.post("/register-user", async (req, res) => {
  try {
    const { tenantName, name, email, password, role } = req.body;

    if (!tenantName || !name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      return res.status(404).json({ message: "Company not found" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "MEMBER",
      tenantId: tenant._id,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      message: "User added to company",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant._id,
      },
    });
  } catch (err) {
    console.error("REGISTER USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   LOGIN USER
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // select password explicitly
    const user = await User.findOne({ email, isActive: true }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   REFRESH ACCESS TOKEN
========================= */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (
      typeof decoded.tokenVersion === "number" &&
      decoded.tokenVersion !== (user.tokenVersion || 0)
    ) {
      return res.status(401).json({ message: "Refresh token no longer valid" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.json({
      message: "Token refreshed",
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error("REFRESH ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
