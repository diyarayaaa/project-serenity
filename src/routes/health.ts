import { Elysia, t } from "elysia";
import { pool } from "../db";

export const healthRoutes = new Elysia().get(
  "/health",
  async () => {
    try {
      const connection = await pool.getConnection();
      connection.release();
      return { status: "ok", database: "connected" };
    } catch (error) {
      return { status: "ok", database: "disconnected" };
    }
  },
  {
    detail: {
      tags: ["Health Check"],
      summary: "Database Health Check",
      description:
        "Memeriksa status konektivitas koneksi database MySQL secara real-time",
      responses: {
        200: {
          description: "Status kesehatan sistem berhasil diperiksa",
        },
      },
    },
    response: {
      200: t.Object({
        status: t.String(),
        database: t.String(),
      }),
    },
  }
);
