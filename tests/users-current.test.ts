import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "../src";
import { cleanDatabase } from "./helpers/db-helper";

describe("GET /api/users/current (Get Current User)", () => {
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

    // 2. Login untuk mendapatkan token valid
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

  it("should successfully return user profile with valid Bearer token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;

    expect(body.data).toBeDefined();
    expect(body.data.name).toBe("Serenity User");
    expect(body.data.email).toBe("serenity@example.com");
    expect(body.data.id).toBeDefined();
    expect(body.data.created_at).toBeDefined();

    // Verifikasi keamanan: password TIDAK boleh ada di response
    expect(body.data.password).toBeUndefined();
  });

  it("should fail with 401 if token is invalid or does not exist in database", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer fake-invalid-token-12345",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should fail with 401 if Authorization header is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should fail with 401 if Authorization Bearer token is empty", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer ",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
