import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Ensure database client is instantiated safely
function createDbClient() {
  if (!connectionString) {
    // When DATABASE_URL is not yet configured, return a mockable proxy to avoid build-time errors
    const dummySql = (async () => []) as any;
    return drizzle(dummySql, { schema });
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDbClient();
export { schema };
