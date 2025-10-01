import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { Server as IOServer } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import { pool } from "./db/config.js";


// --- Create Fastify instance ---
const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  },
});


// --- Enable CORS ---
await fastify.register(cors, {
  origin: "*", // allow all for testing; restrict in production
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// --- Serve uploads folder ---
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
});

// --- Setup Socket.IO BEFORE registering routes ---
const io = new IOServer({
  cors: { origin: "*" },
});

// --- Decorate Fastify with io BEFORE routes ---
fastify.decorate("io", io);

// --- Register routes ---
fastify.register(userRoutes, { prefix: "/api/user" });

// --- Start server with DB connection ---
const start = async () => {
  try {
    await pool.connect();
    console.log("Connected to PostgreSQL database");

    // Start Fastify server
    await fastify.listen({ port: 5000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:5000");

    // Attach Socket.IO to the running server
    io.attach(fastify.server);

    // Handle Socket.IO connections
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Handle room joining for targeted events
      socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();