import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { routes } from "./routes";
import { env } from "./config/env";

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Project Serenity API",
          version: "1.0.0",
          description:
            "Dokumentasi resmi Backend RESTful API Project Serenity. Dilengkapi dengan autentikasi berbasis Bearer Token session UUID.",
        },
        tags: [
          {
            name: "Health Check",
            description:
              "Endpoint pemantauan status server dan koneksi database",
          },
          {
            name: "Authentication & Users",
            description:
              "Endpoint manajemen akun, registrasi, login, profil, dan logout",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
              description:
                "Masukkan token UUID yang didapatkan setelah login",
            },
          },
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
console.log(
  `📖 Swagger documentation is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
