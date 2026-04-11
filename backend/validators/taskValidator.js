const { z } = require("zod");

exports.createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string().length(24).regex(/^[a-f0-9]+$/i),
  assignedTo: z.string().optional(),
  status: z.enum(["TODO","IN_PROGRESS","DONE"]).optional(),
  dueDate: z.string().optional()
});

exports.updateTaskSchema = exports.createTaskSchema.partial();
