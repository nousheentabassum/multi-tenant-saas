const mongoose = require("mongoose");

/* ---------- COMMENT SUB-SCHEMA ---------- */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

/* ---------- TASK SCHEMA ---------- */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    dueDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },


    comments: [commentSchema],
  },
  { timestamps: true }
);

// Compound index to accelerate common tenant-scoped queries
taskSchema.index({ tenantId: 1, status: 1 });
taskSchema.index({ tenantId: 1, projectId: 1 });

module.exports = mongoose.model("Task", taskSchema);
