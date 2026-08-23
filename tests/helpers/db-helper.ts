import { db } from "../../src/db";
import { sessions } from "../../src/db/schema/sessions";
import { users } from "../../src/db/schema/users";

export async function cleanDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}
