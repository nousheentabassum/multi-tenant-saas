const { Queue } = require("bullmq");

let emailQueue = null;

if (process.env.NODE_ENV !== "test") {
  emailQueue = new Queue("emailQueue", {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  });
}

module.exports = emailQueue;
