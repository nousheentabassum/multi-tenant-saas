const { createClient } = require("redis");
              
let client = null;

/** In-memory mock for test env when Redis is not available */
const noopRedis = {
  get: async () => null,
  setEx: async () => "OK",
  del: async () => 0,
  quit: async () => {},
};

async function getRedis() {
  if (process.env.NODE_ENV === "test") {
    return noopRedis;
  }
  if (!client) {
    const opts = process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {};
    client = createClient(opts);
    client.on("connect", () => {
      console.log("Redis connected");
    });
    await client.connect();
  }
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
  // noopRedis needs no close
}

module.exports = {
  getRedis,
  closeRedis
};
