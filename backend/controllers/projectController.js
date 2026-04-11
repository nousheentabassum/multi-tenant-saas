const Project = require("../models/Project");
const { getRedis } = require("../config/redis");
const emailQueue = require("../queues/emailQueue");

// ================= CREATE PROJECT =================
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name required" });
    }

    const project = await Project.create({
      name,
      tenant: req.user.tenantId
    });

    // ✅ invalidate cache
    const redis = await getRedis();
    await redis.del(`projects:${req.user.tenantId}`);
    // ✅ add email job (INSIDE function) — guarded for test env
if (emailQueue) {
  await emailQueue.add("projectCreated", {
    to: "test@example.com",
    projectName: project.name
  });
}


    
    res.status(201).json({
      message: "Project created",
      project
    });

  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PROJECTS (with pagination) =================
exports.getProjects = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { tenant: req.user.tenantId };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });

  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
