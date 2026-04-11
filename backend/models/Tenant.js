const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    /* Tenant owner (Admin user) */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    /* Subscription plan (mocked SaaS feature) */
    plan: {
      type: String,
      enum: ["FREE", "PRO", "ENTERPRISE"],
      default: "FREE",
    },

    /* Tenant status */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
