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
    const errorMessage =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "Internal Server Error";
    return { error: errorMessage };
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
        name: t.String({
          minLength: 1,
          maxLength: 255,
          error: "Name wajib diisi dan maksimal 255 karakter",
        }),
        email: t.String({
          format: "email",
          maxLength: 255,
          error: "Format email tidak valid atau melebihi 255 karakter",
        }),
        password: t.String({
          minLength: 6,
          error: "Password minimal 6 karakter",
        }),
      }),
      detail: {
        tags: ["Authentication & Users"],
        summary: "Registrasi User Baru",
        description:
          "Mendaftarkan akun pengguna baru ke dalam sistem dengan password yang dienkripsi menggunakan Bcrypt.",
        responses: {
          200: { description: "User berhasil didaftarkan" },
          400: { description: "Validasi gagal atau email sudah terdaftar" },
          500: { description: "Internal server error" },
        },
      },
      response: {
        200: t.Object({
          data: t.String({ examples: ["OK"] }),
        }),
        400: t.Object({
          error: t.String({ examples: ["Email sudah terdaftar"] }),
        }),
        500: t.Object({
          error: t.String({ examples: ["Internal Server Error"] }),
        }),
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
        email: t.String({
          format: "email",
          maxLength: 255,
          error: "Format email tidak valid atau melebihi 255 karakter",
        }),
        password: t.String({ minLength: 1, error: "Password wajib diisi" }),
      }),
      detail: {
        tags: ["Authentication & Users"],
        summary: "Login User",
        description:
          "Mengautentikasi pengguna menggunakan email dan password, menghasilkan session token unik berupa UUID.",
        responses: {
          200: { description: "Login berhasil, mengembalikan session token" },
          400: {
            description: "Email atau password salah / format tidak valid",
          },
          500: { description: "Internal server error" },
        },
      },
      response: {
        200: t.Object({
          data: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
        }),
        400: t.Object({
          error: t.String({ examples: ["Email atau password salah"] }),
        }),
        500: t.Object({
          error: t.String({ examples: ["Internal Server Error"] }),
        }),
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
        tags: ["Authentication & Users"],
        summary: "Get Current User Profile",
        description:
          "Mengambil data profil pengguna yang saat ini sedang login berdasarkan token Bearer session.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Data profil user berhasil diambil" },
          401: {
            description:
              "Unauthorized - Token tidak valid atau tidak disertakan",
          },
          500: { description: "Internal server error" },
        },
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number({ examples: [1] }),
            name: t.String({ examples: ["Serenity User"] }),
            email: t.String({ examples: ["user@example.com"] }),
            created_at: t.String({ examples: ["2026-08-25T09:00:00.000Z"] }),
          }),
        }),
        401: t.Object({
          error: t.String({ examples: ["Unauthorized"] }),
        }),
        500: t.Object({
          error: t.String({ examples: ["Internal Server Error"] }),
        }),
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
        tags: ["Authentication & Users"],
        summary: "Logout User",
        description:
          "Mengakhiri sesi pengguna dengan menghapus record token session dari database.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logout berhasil dan session dihapus" },
          401: { description: "Unauthorized - Token tidak valid" },
          500: { description: "Internal server error" },
        },
      },
      response: {
        200: t.Object({
          data: t.String({ examples: ["OK"] }),
        }),
        401: t.Object({
          error: t.String({ examples: ["Unauthorized"] }),
        }),
        500: t.Object({
          error: t.String({ examples: ["Internal Server Error"] }),
        }),
      },
    }
  );
