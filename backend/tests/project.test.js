const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const { closeRedis } = require("../config/redis");

let baseToken;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "test@test.com",
    password: "123456",
    tenantName: "TenantA"
  });

  const res = await request(app).post("/api/auth/login").send({
    name: "Test User",
    email: "test@test.com",
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

describe("Project API", () => {

  test("create project success", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${baseToken}`)
      .send({ name: "Test Project" });

    expect(res.statusCode).toBe(201);
  });

  test("create project fails without name", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${baseToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test("get projects requires auth", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.statusCode).toBe(401);
  });

  test("tenant isolation", async () => {
    const tokenA = await createUser("a@p.com", "TA");
    const tokenB = await createUser("b@p.com", "TB");

    await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Secret" });

    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.body.projects.length).toBe(0);
  });

});
afterAll(async () => {
  await mongoose.connection.close();
  await closeRedis();
});
