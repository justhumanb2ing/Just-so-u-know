import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@/types/database";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false, // 호환성을 위해 false 설정
  },
});

export const dialect = new PostgresDialect({
  pool,
});

export const kysely = new Kysely<Database>({
  dialect,
});
