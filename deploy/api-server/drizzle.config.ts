import { defineConfig } from "drizzle-kit"
import dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "mysql://bdnet_aba_user:CHANGE_ME@127.0.0.1:3306/bdnet_aba_mobile"
  }
})
