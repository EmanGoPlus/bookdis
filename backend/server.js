import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static"; // <-- import
import path from "path";
import userRoutes from "./routes/merchantRoutes.js";
import { pool } from "./db/config.js";

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  },
});

// Enable CORS
await fastify.register(cors, {
  origin: "*", // allow all for testing; later restrict to your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Serve uploads folder
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"), // folder where logos exist
  prefix: "/uploads/", // must match the DB paths
});

// Register routes
fastify.register(userRoutes, { prefix: "/api/merchant" });

// PostgreSQL + start server
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
