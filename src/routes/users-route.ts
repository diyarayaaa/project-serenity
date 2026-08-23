import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";
import { BadRequestError, UnauthorizedError } from "../errors";

function extractBearerToken(authorization?: string): string {
  if (!authorization) {
    throw new UnauthorizedError("Unauthorized");
  }

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : authorization.trim();

  if (!token) {
    throw new UnauthorizedError("Unauthorized");
  }

  return token;
}

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .onError(({ code, error, set }) => {
    if (error instanceof BadRequestError) {
      set.status = 400;
      return { error: error.message };
    }

    if (error instanceof UnauthorizedError) {
      set.status = 401;
      return { error: error.message };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: error.message };
    }

    set.status = 500;
    return { error: error.message || "Internal Server Error" };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const result = await UsersService.register(body);
      set.status = 200;
      return result;
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
      const result = await UsersService.login(body);
      set.status = 200;
      return result;
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
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers.authorization);
      const result = await UsersService.getCurrentUser(token);
      set.status = 200;
      return result;
    },
    {
      headers: t.Object({
        authorization: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get Current User",
        description:
          "Mengambil data profil user yang sedang login berdasarkan Bearer token session",
      },
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers.authorization);
      const result = await UsersService.logout(token);
      set.status = 200;
      return result;
    },
    {
      headers: t.Object({
        authorization: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "Logout User",
        description:
          "Menghapus session token dari database untuk mengakhiri sesi user",
      },
    }
  );
