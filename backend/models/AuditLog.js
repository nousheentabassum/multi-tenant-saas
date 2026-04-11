const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    action: {
      type: String,
      required: true
    },

    targetType: {
      type: String,
      required: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  { timestamps: true }
);

// Common query pattern: latest logs per tenant
auditLogSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
