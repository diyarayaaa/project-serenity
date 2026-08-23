import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { routes } from "./routes";
import { env } from "./config/env";

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Project Serenity API",
          version: "1.0.0",
          description: "Backend API for Project Serenity",
        },
      },
    })
  )
  .use(routes)
  .get("/", () => ({
    name: "Project Serenity API",
    version: "1.0.0",
    status: "running",
  }))
  .listen(env.PORT);

console.log(
  `🚀 Project Serenity API is running at http://${app.server?.hostname}:${app.server?.port}`
);
