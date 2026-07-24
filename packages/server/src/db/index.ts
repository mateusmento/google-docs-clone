import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleBetterSqlite3 } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzleD1(d1, { schema });
}

export function createTestDb(sqlite: import("better-sqlite3").Database) {
  return drizzleBetterSqlite3(sqlite, { schema });
}

export type Database = ReturnType<typeof createDb> | ReturnType<typeof createTestDb>;
