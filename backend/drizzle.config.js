import dotenv from "dotenv";

dotenv.config();

const connectionString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

export default {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",   //change from driver to dialect
  dbCredentials: {
    url: connectionString, //use url instead of connectionString
  },
};
