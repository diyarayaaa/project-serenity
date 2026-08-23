import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

export class UsersService {
  static async register(dto: RegisterUserDTO) {
    const { name, email, password } = dto;

    // 1. Cek apakah email sudah terdaftar
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan user baru ke database
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    // 4. Return respon sukses
    return { data: "OK" };
  }
}
