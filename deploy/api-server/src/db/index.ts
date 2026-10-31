import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import * as schema from "./schema.js"

const connectionString =
  process.env.DATABASE_URL ||
  "mysql://bdnet_aba_user:CHANGE_ME@127.0.0.1:3306/bdnet_aba_mobile"

const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10
})

export const db = drizzle(pool, { schema, mode: "default" })
export { pool }
