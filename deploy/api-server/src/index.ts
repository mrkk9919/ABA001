import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import { eq } from "drizzle-orm"
import { db, pool } from "./db/index.js"
import { accounts, transactions } from "./db/schema.js"

const app = express()
const PORT = Number(process.env.PORT || 5200)

app.use(cors())
app.use(express.json())

// 健康检查（含数据库连通性）
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1")
    res.json({ ok: true, db: "mysql connected", port: PORT })
  } catch (err: any) {
    res.status(500).json({ ok: false, db: err.message })
  }
})

// 获取账户列表（从 MySQL 读取）
app.get("/api/accounts", async (_req, res) => {
  try {
    const rows = await db.select().from(accounts)
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        currency: r.currency,
        balance: r.balance,
        accountNo: r.accountNo
      }))
    )
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 获取单个账户
app.get("/api/accounts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const rows = await db.select().from(accounts).where(eq(accounts.id, id))
    if (rows.length === 0) {
      res.status(404).json({ error: "account not found" })
      return
    }
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 转账接口：写交易流水，返回 success 后由前端播音
app.post("/api/transfer", async (req, res) => {
  const { amount, recipientAccount, channel = "aba_internal", currency = "USD" } = req.body || {}

  if (!amount || !recipientAccount) {
    res.status(400).json({ success: false, error: "amount and recipientAccount are required" })
    return
  }

  try {
    // 默认从 1 号账户扣款
    const fromAccountId = 1

    await db.insert(transactions).values({
      fromAccountId,
      toAccountNo: String(recipientAccount),
      amount: String(amount),
      currency: String(currency),
      channel: String(channel),
      status: "success"
    })

    res.json({
      success: true,
      message: "Transfer request received",
      amount,
      recipientAccount,
      channel
    })
  } catch (err: any) {
    // 即使数据库写入失败，也不影响核心转账流程时可按需放行；这里返回失败以便排查
    res.status(500).json({ success: false, error: err.message })
  }
})

// 注意：/api/khmer-tts 由站点 PHP 提供，Node 网关不处理该路径。

app.listen(PORT, () => {
  console.log(`✅ ABA API Server running at http://127.0.0.1:${PORT}`)
})
