const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // 🔒 prevent password from being returned
    },

    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "MEMBER"],
      default: "MEMBER",
    },

    // Used to invalidate/rotate refresh tokens
    tokenVersion: {
      type: Number,
      default: 0
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true, // ⚡ faster tenant-based queries
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
