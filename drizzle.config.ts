import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: `mysql://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`,
  },
});

