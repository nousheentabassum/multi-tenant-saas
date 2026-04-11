const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

// Ensure fast lookups per-tenant and by creation time
projectSchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
