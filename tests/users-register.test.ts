import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { cleanDatabase } from "./helpers/db-helper";

describe("POST /api/users (User Registration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it("should successfully register a new user with valid data", async () => {
    const response = await app.handle(
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

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: "OK" });

    // Verifikasi data tersimpan di database dengan password ter-hash
    const [savedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "serenity@example.com"))
      .limit(1);

    expect(savedUser).toBeDefined();
    expect(savedUser?.name).toBe("Serenity User");
    expect(savedUser?.email).toBe("serenity@example.com");
    expect(savedUser?.password).not.toBe("password123");
    expect(
      await Bun.password.verify("password123", savedUser?.password || "")
    ).toBeTrue();
  });

  it("should fail if email is already registered (duplicate email)", async () => {
    // Registrasi user pertama
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User First",
          email: "duplicate@example.com",
          password: "password123",
        }),
      })
    );

    // Registrasi user kedua dengan email yang sama
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User Second",
          email: "duplicate@example.com",
          password: "password456",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Email sudah terdaftar" });
  });

  it("should fail if name is empty (minLength: 1)", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          email: "valid@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("should fail if name exceeds 255 characters (maxLength: 255)", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A".repeat(256),
          email: "valid@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.error).toContain("Name wajib diisi dan maksimal 255 karakter");
  });

  it("should fail if email format is invalid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "invalid-email-format",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("should fail if email exceeds 255 characters (maxLength: 255)", async () => {
    const longEmail = "a".repeat(250) + "@example.com";
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: longEmail,
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("should fail if password is less than 6 characters (minLength: 6)", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@example.com",
          password: "12345",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("should fail if request body is empty or missing required fields", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });
});
