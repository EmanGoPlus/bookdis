import Fastify from "fastify";
import cors from "@fastify/cors";
import userRoutes from "./routes/userRoutes.js";
import { pool } from "./db/config.js";

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty", // for readable logs
      options: {
        translateTime: "SYS:standard",
        ignore: "pid,hostname", 
      },
    },
  },
});



await fastify.register(cors, {
  origin: "http://localhost:5173", // your React frontend
  methods: ["GET", "POST", "PUT", "DELETE"], // allowed methods
});

fastify.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  function (req, body, done) {
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done(err, undefined);
    }
  }
);

fastify.register(userRoutes, {prefix: "/api/users"});

const start = async () => {
  try {
    await pool.connect();
    console.log("Connected to PostgreSQL database");

    await fastify.listen({ port: 5000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
