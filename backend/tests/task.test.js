const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const { closeRedis } = require("../config/redis");


let baseToken;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "task@test.com",
    password: "123456",
    tenantName: "TaskTenant"
  });

  const res = await request(app).post("/api/auth/login").send({
    name: "Test User",
    email: "task@test.com",
    password: "123456"
  });

  baseToken = res.body.token;
});

async function createUser(email, tenant) {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "pass123",
    tenantName: tenant
  });

  const login = await request(app).post("/api/auth/login").send({
    name: "Test User",
    email,
    password: "pass123"
  });

  return login.body.token;
}

describe("Task API", () => {
  let projectId;
  let taskId;

  test("create project", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${baseToken}`)
      .send({ name: "TaskProj" });

    expect(res.statusCode).toBe(201);
    projectId = res.body.project._id;
  });

  test("create task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${baseToken}`)
      .send({ title: "Task1", projectId });

    expect(res.statusCode).toBe(201);
    taskId = res.body.task._id;
  });

  test("update status", async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${baseToken}`)
      .send({ status: "DONE" });

    expect(res.statusCode).toBe(200);
  });

  test("analytics", async () => {
    const res = await request(app)
      .get("/api/tasks/analytics")
      .set("Authorization", `Bearer ${baseToken}`);

    expect(res.statusCode).toBe(200);
  });
});

describe("Task validation", () => {

  test("missing projectId", async () => {
    const token = await createUser("x@x.com", "X");

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task" });

    expect(res.statusCode).toBe(400);
  });

});
afterAll(async () => {
  await mongoose.connection.close();
  await closeRedis();
});

