const { Worker } = require("bullmq");

const worker = new Worker(
  "emailQueue",
  async job => {
    console.log("Processing email job:", job.data);

    // simulate work
    await new Promise(r => setTimeout(r, 1000));

    console.log("Email sent to:", job.data.to);
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);
