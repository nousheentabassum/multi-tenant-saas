const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Multi-Tenant SaaS API",
      version: "1.0.0",
      description: "Task + Project SaaS backend"
    },
    servers: [
      {
        url: "http://localhost:5000"
      }
    ]
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJSDoc(options);
