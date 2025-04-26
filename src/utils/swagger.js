import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LMS Backend",
      version: "1.0.0",
      description: "API documentation for the LMS Backend",
    },
    servers: [
      {
        url: process.env.NODE_ENV === "development" ? "http://localhost:8000" : process.env.PRODUCTION_URL,
        description: process.env.NODE_ENV === "development" ? "Development Server" : "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", 
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export default options;
