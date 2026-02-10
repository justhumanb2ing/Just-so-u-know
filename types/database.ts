import type { KyselifyDatabase } from "kysely-supabase";
import type { Database as SupabaseDatabase } from "./supabase";

export type Database = KyselifyDatabase<SupabaseDatabase>;
