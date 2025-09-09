import Fastify from "fastify";
import cors from "@fastify/cors";
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
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// fastify.register(fastifyMultipart, {
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit per file
//   },
// });

// JSON parser (optional if you want custom behavior)
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

// Register routes
fastify.register(userRoutes, { prefix: "/api/merchant" });

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
