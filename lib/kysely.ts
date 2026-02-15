import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@/types/database";

type KyselyGlobal = typeof globalThis & {
  __tsukiPgPool?: Pool;
  __tsukiDialect?: PostgresDialect;
  __tsukiKysely?: Kysely<Database>;
};

const kyselyGlobal = globalThis as KyselyGlobal;
const DEFAULT_PG_POOL_MAX = 3;
const PG_POOL_MAX_UPPER_BOUND = 20;

/**
 * 환경 변수 PG_POOL_MAX를 정수로 파싱하고 안전 범위(1..20)로 제한한다.
 */
function resolvePgPoolMax() {
  const rawValue = process.env.PG_POOL_MAX?.trim();

  if (!rawValue) {
    return DEFAULT_PG_POOL_MAX;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PG_POOL_MAX;
  }

  return Math.min(parsedValue, PG_POOL_MAX_UPPER_BOUND);
}

/**
 * pg Pool을 생성한다. Session mode 연결 제한을 넘지 않도록 max를 낮게 유지한다.
 */
function createPool() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: {
      rejectUnauthorized: false, // 호환성을 위해 false 설정
    },
    max: resolvePgPoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (error) => {
    console.error("[kysely] Unexpected idle client error.", error);
  });

  return pool;
}

const pool = kyselyGlobal.__tsukiPgPool ?? createPool();

if (!kyselyGlobal.__tsukiPgPool) {
  kyselyGlobal.__tsukiPgPool = pool;
}

export const dialect = kyselyGlobal.__tsukiDialect ?? new PostgresDialect({ pool });

if (!kyselyGlobal.__tsukiDialect) {
  kyselyGlobal.__tsukiDialect = dialect;
}

export const kysely =
  kyselyGlobal.__tsukiKysely ??
  new Kysely<Database>({
    dialect,
  });

if (!kyselyGlobal.__tsukiKysely) {
  kyselyGlobal.__tsukiKysely = kysely;
}
