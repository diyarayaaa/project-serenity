import { Elysia } from "elysia";
import { pool } from "../db";

export const healthRoutes = new Elysia().get("/health", async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return { status: "ok", database: "connected" };
  } catch (error) {
    return { status: "ok", database: "disconnected" };
  }
});
