import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { sessions } from "../src/db/schema/sessions";
import { cleanDatabase } from "./helpers/db-helper";

describe("DELETE /api/users/logout (User Logout)", () => {
  let validToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    // 1. Registrasi user
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Serenity User",
          email: "serenity@example.com",
          password: "password123",
        }),
      })
    );

    // 2. Login untuk mendapatkan session token valid
    const loginRes = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "serenity@example.com",
          password: "password123",
        }),
      })
    );

    const loginBody = (await loginRes.json()) as any;
    validToken = loginBody.data;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it("should successfully logout and delete session from database", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: "OK" });

    // Verifikasi bahwa session benar-benar terhapus dari database
    const [deletedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken))
      .limit(1);

    expect(deletedSession).toBeUndefined();

    // Verifikasi token tidak dapat digunakan lagi di GET /current
    const currentRes = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(currentRes.status).toBe(401);
  });

  it("should fail with 401 when trying to logout again with already deleted token", async () => {
    // Logout pertama (sukses)
    await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    // Logout kedua dengan token yang sama (harus gagal)
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should fail with 401 if token is invalid or does not exist", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer non-existent-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should fail with 401 if Authorization header is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
