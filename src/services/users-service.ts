import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";
import { BadRequestError, UnauthorizedError } from "../errors";

/**
 * Data Transfer Object (DTO) untuk payload registrasi pengguna baru.
 */
export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * Data Transfer Object (DTO) untuk payload login pengguna.
 */
export interface LoginUserDTO {
  email: string;
  password: string;
}

/**
 * Service layer yang menangani seluruh business logic terkait autentikasi dan manajemen pengguna.
 */
export class UsersService {
  /**
   * Mendaftarkan pengguna baru ke dalam sistem.
   *
   * Alur kerja:
   * 1. Memeriksa apakah email sudah terdaftar di database untuk mencegah duplikasi.
   * 2. Mengenkrpsi (hash) password plaintext menggunakan algoritma Bcrypt bawaan Bun.
   * 3. Menyimpan data pengguna baru ke tabel `users`.
   * 4. Mengembalikan respons status sukses.
   *
   * @param dto - Object berisi `name`, `email`, dan `password` plaintext.
   * @returns Object `{ data: "OK" }` jika registrasi berhasil.
   * @throws BadRequestError jika email sudah digunakan oleh akun lain.
   */
  static async register(dto: RegisterUserDTO) {
    const { name, email, password } = dto;

    // 1. Cek apakah email sudah terdaftar
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new BadRequestError("Email sudah terdaftar");
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

  /**
   * Mengautentikasi pengguna menggunakan kredensial email dan password.
   *
   * Alur kerja:
   * 1. Mencari data pengguna di database berdasarkan alamat email.
   * 2. Memverifikasi kecocokan password plaintext dengan hash Bcrypt di database.
   * 3. Menghasilkan token sesi unik berbasis UUID v4 (`crypto.randomUUID()`).
   * 4. Menyimpan data sesi ke tabel `sessions` dengan relasi ke user terkait.
   * 5. Mengembalikan token sesi kepada client.
   *
   * @param dto - Object berisi `email` dan `password` untuk login.
   * @returns Object `{ data: "<session_token_uuid>" }` berisi token autentikasi.
   * @throws BadRequestError jika email tidak ditemukan atau password salah.
   */
  static async login(dto: LoginUserDTO) {
    const { email, password } = dto;

    // 1. Cari user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new BadRequestError("Email atau password salah");
    }

    // 2. Verifikasi password dengan bcrypt
    const isPasswordValid = await Bun.password.verify(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError("Email atau password salah");
    }

    // 3. Generate token UUID baru
    const token = crypto.randomUUID();

    // 4. Simpan session ke database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    // 5. Kembalikan token
    return { data: token };
  }

  /**
   * Mengambil data profil pengguna yang saat ini sedang login berdasarkan token sesi.
   *
   * Alur kerja:
   * 1. Melakukan query JOIN antara tabel `sessions` dan `users` berdasarkan token sesi yang valid.
   * 2. Memilih hanya data profil publik (`id`, `name`, `email`, `created_at`) tanpa mengekspos hash password.
   * 3. Memastikan sesi aktif dan terdaftar di database.
   *
   * @param token - Token sesi (UUID) yang diekstrak dari header Authorization Bearer.
   * @returns Object `{ data: { id, name, email, created_at } }` berisi profil pengguna.
   * @throws UnauthorizedError jika token tidak valid, kadaluarsa, atau tidak ditemukan di database.
   */
  static async getCurrentUser(token: string) {
    // Cari session dan join ke users
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!result) {
      throw new UnauthorizedError("Unauthorized");
    }

    return {
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        created_at: result.createdAt,
      },
    };
  }

  /**
   * Mengakhiri sesi login pengguna (logout) dengan menghapus record token sesi dari database.
   *
   * Alur kerja:
   * 1. Menjalankan query `DELETE` langsung pada tabel `sessions` berdasarkan token.
   * 2. Memeriksa `affectedRows` untuk memastikan token memang ada sebelum dihapus.
   * 3. Jika token tidak ditemukan, menganggap request unauthorized.
   * 4. Setelah berhasil dihapus, token tersebut otomatis tidak dapat digunakan kembali.
   *
   * @param token - Token sesi (UUID) yang akan dihapus/dibatalkan.
   * @returns Object `{ data: "OK" }` jika sesi berhasil diakhiri.
   * @throws UnauthorizedError jika token tidak valid atau sudah tidak ada di database.
   */
  static async logout(token: string) {
    // Single-query delete dan cek affectedRows
    const [result] = await db
      .delete(sessions)
      .where(eq(sessions.token, token));

    if (result.affectedRows === 0) {
      throw new UnauthorizedError("Unauthorized");
    }

    return { data: "OK" };
  }
}
