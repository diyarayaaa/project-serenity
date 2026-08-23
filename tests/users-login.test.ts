import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { sessions } from "../src/db/schema/sessions";
import { cleanDatabase } from "./helpers/db-helper";

describe("POST /api/users/login (User Login)", () => {
  beforeEach(async () => {
    await cleanDatabase();

    // Daftarkan user test untuk login
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
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it("should successfully login with valid credentials and return a token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "serenity@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");

    // Pastikan token tersimpan di tabel sessions
    const [savedSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, body.data))
      .limit(1);

    expect(savedSession).toBeDefined();
    expect(savedSession?.token).toBe(body.data);
  });

  it("should fail if email is not registered", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "notfound@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("should fail if password is wrong", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "serenity@example.com",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("should fail if email format is invalid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bukan-email",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("should fail if password is empty", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "serenity@example.com",
          password: "",
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
