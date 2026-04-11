const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const { closeRedis } = require("../config/redis");

describe("Auth API", () => {
  test("login fails with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test("login fails with wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "a@test.com",
      password: "pass123",
      tenantName: "A"
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "a@test.com",
      password: "wrongpass"
    });

    expect(res.statusCode).toBe(401);
  });

  test("protected route fails without token", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.statusCode).toBe(401);
  });

  test("protected route fails with fake token", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", "Bearer faketoken");

    expect(res.statusCode).toBe(401);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await closeRedis();
});

