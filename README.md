# Project Serenity

Backend API project built with **Bun**, **ElysiaJS**, **Drizzle ORM**, and **MySQL**.

## Prerequisites

- [Bun](https://bun.sh) runtime
- MySQL server running locally or remotely

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env` and update the database credentials:

```bash
cp .env.example .env
```

### 3. Run development server

```bash
bun dev
```

Server will start at `http://localhost:3000`.

## Available Scripts

| Script            | Command                        | Description                     |
| ----------------- | ------------------------------ | ------------------------------- |
| `bun dev`         | `bun --watch src/index.ts`     | Start dev server with hot reload|
| `bun start`       | `bun src/index.ts`             | Start production server         |
| `bun db:generate` | `bunx drizzle-kit generate`    | Generate Drizzle migrations     |
| `bun db:push`     | `bunx drizzle-kit push`        | Push schema changes to database |
| `bun db:studio`   | `bunx drizzle-kit studio`      | Open Drizzle Studio GUI         |

## API Endpoints

| Method | Path       | Description              |
| ------ | ---------- | ------------------------ |
| GET    | `/`        | API info                 |
| GET    | `/health`  | Health check + DB status |
| GET    | `/swagger` | Swagger API docs         |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [ElysiaJS](https://elysiajs.com)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Database**: MySQL
