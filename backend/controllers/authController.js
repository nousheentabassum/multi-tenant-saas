const User = require("../models/User");
const Tenant = require("../models/Tenant");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password, tenantName } = req.body;

    if (!name || !email || !password || !tenantName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    /* Check if user already exists */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    /* Check if tenant already exists */
    let tenant = await Tenant.findOne({ name: tenantName });

    /* Hash password */
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    /* If tenant does NOT exist → create tenant + ADMIN user */
    if (!tenant) {
      tenant = await Tenant.create({
        name: tenantName,
        owner: null, // temporary
      });

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: tenant._id,
      });

      /* Assign tenant owner */
      tenant.owner = user._id;
      await tenant.save();
    } 
    /* If tenant EXISTS → normal MEMBER user */
    else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
        tenantId: tenant._id,
      });
    }

    return res.status(201).json({
      message: "User registered successfully",
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    /* IMPORTANT: select password explicitly */
    const user = await User.findOne({ email })
      .select("+password")
      .populate("tenantId");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* Generate JWT */
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenantId.name,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

