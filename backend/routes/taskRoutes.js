console.log("TASK ROUTES FILE LOADED");

const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/tenantRateLimit");
const requireRole = require("../middleware/requireRole"); // ✅ added
const validate = require("../middleware/validate");
const { createTaskSchema, updateTaskSchema } = require("../validators/taskValidator");


const Task = require("../models/Task");
const AuditLog = require("../models/AuditLog");
const Project = require("../models/Project");
const { getRedis } = require("../config/redis");


// apply once at router level
router.use(auth);
router.use(rateLimit);


// ================= STATUS MAP =================
const statusMap = {
  "todo": "TODO",
  "in-progress": "IN_PROGRESS",
  "done": "DONE"
};
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */




// ================= CREATE TASK =================
router.post("/", requireRole("ADMIN","MANAGER"), validate(createTaskSchema), async (req, res) => {
  try {
    const { title, description, assignedTo, status, projectId, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        message: "Title and Project ID are required"
      });
    }

    // Enforce that the project also belongs to the same tenant
    const project = await Project.findOne({
      _id: projectId,
      tenant: req.user.tenantId
    });

    if (!project) {
      return res.status(403).json({
        message: "Project does not belong to your tenant"
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo: assignedTo || null,
      status: status || "TODO",
      projectId: project._id,
      createdBy: req.user.userId,
      tenantId: req.user.tenantId,
      dueDate: dueDate || null
    });

    await AuditLog.create({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: "CREATED_TASK",
      targetType: "Task",
      targetId: task._id
    });

    const redis = await getRedis();
    await redis.del(`taskstats:${req.user.tenantId}`);

    res.status(201).json({ task });

  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});



// ================= GET TASKS (with pagination) =================
router.get("/", async (req, res) => {
  try {
    const { status, assignedTo, projectId } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { tenantId: req.user.tenantId };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (projectId) filter.projectId = projectId;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("assignedTo", "name role")
        .populate("createdBy", "name role")
        .populate("projectId", "name")
        .populate("comments.user", "name"),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });

  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= ANALYTICS =================
// All authenticated users (ADMIN, MANAGER, MEMBER) can view tenant analytics.
// Route must be before /:id so "analytics" is not matched as task id.
router.get("/analytics", async (req, res) => {
  try {
    const redis = await getRedis();
    const key = `taskstats:${req.user.tenantId}`;

    const cached = await redis.get(key);

    if (cached) {
      return res.json({
        ...JSON.parse(cached),
        cached: true
      });
    }

    const tasks = await Task.find({
      tenantId: req.user.tenantId
    });

    const stats = {
      TODO: tasks.filter(t => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter(t => t.status === "DONE").length,
      overdue: tasks.filter(
        t => t.dueDate && new Date(t.dueDate) < new Date()
      ).length
    };

    const payload = { stats };

    await redis.setEx(key, 120, JSON.stringify(payload));

    res.json(payload);

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= UPDATE TASK =================
router.put("/:id", requireRole("ADMIN","MANAGER"),validate(updateTaskSchema), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, assignedTo, status, dueDate } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    if (status && ["TODO","IN_PROGRESS","DONE"].includes(status)) {
      task.status = status;
    }

    if (dueDate) task.dueDate = dueDate;

    await task.save();

    await AuditLog.create({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: "UPDATE",
      targetType: "TASK",
      targetId: task._id
    });

    const redis = await getRedis();
    await redis.del(`taskstats:${req.user.tenantId}`);

    res.json({ message: "Task updated", task });

  } catch (err) {
    console.error("UPDATE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// ================= DELETE TASK =================
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();

    await AuditLog.create({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: "DELETE",
      targetType: "TASK",
      targetId: task._id
    });

    const redis = await getRedis();
    await redis.del(`taskstats:${req.user.tenantId}`);

    res.json({ message: "Task deleted" });

  } catch (err) {
    console.error("DELETE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= COMMENT =================
router.post("/:id/comments", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      user: req.user.userId,
      text
    });

    await task.save();

    await AuditLog.create({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: "COMMENT",
      targetType: "TASK",
      targetId: task._id
    });

    res.json({
      message: "Comment added",
      comments: task.comments
    });

  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
