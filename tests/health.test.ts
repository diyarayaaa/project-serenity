import { describe, it, expect } from "bun:test";
import { app } from "../src";

describe("Health Check & Root Endpoint", () => {
  it("GET / should return 200 with API status running", async () => {
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      name: "Project Serenity API",
      version: "1.0.0",
      status: "running",
    });
  });

  it("GET /health should return 200 with database connected", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      status: "ok",
      database: "connected",
    });
  });
});
