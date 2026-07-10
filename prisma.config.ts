import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaMssql } from "@prisma/adapter-mssql";

// NOTE: `adapter` is a runtime-only field in Prisma 7.8.0 (not yet in PrismaConfig type).
// The cast keeps tsc happy while the CLI uses it at runtime.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
  adapter: async (env: Record<string, string>) => {
    const factory = new PrismaMssql(env.DATABASE_URL!);
    return factory.connect();
  },
} as any);
