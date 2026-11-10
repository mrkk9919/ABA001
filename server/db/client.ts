import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to use the database client.');
}

const client = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  prepare: false,
});

export const db = drizzle(client, { schema });
export { client as sqlClient };
