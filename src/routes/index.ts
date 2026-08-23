import { Elysia } from "elysia";
import { healthRoutes } from "./health";
import { usersRoute } from "./users-route";

export const routes = new Elysia().use(healthRoutes).use(usersRoute);

