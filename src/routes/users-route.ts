import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await UsersService.register(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error.message === "Email sudah terdaftar") {
          set.status = 400;
          return { error: "Email sudah terdaftar" };
        }

        set.status = 500;
        return { error: error.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, error: "Name wajib diisi" }),
        email: t.String({ format: "email", error: "Format email tidak valid" }),
        password: t.String({
          minLength: 6,
          error: "Password minimal 6 karakter",
        }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Registrasi User Baru",
        description:
          "Mendaftarkan user baru ke dalam sistem dengan enkripsi bcrypt",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await UsersService.login(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error.message === "Email atau password salah") {
          set.status = 400;
          return { error: "Email atau password salah" };
        }

        set.status = 500;
        return { error: error.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", error: "Format email tidak valid" }),
        password: t.String({ minLength: 1, error: "Password wajib diisi" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Login User",
        description:
          "Autentikasi user dengan email & password, menghasilkan session token UUID",
      },
    }
  );

