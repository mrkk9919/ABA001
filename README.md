# ABA Bank Mobile App (Khmer UI Clone)

ABA 手机银行界面克隆（按 ABA 官方高棉语 UI 重写），Monorepo（pnpm workspace）。

## 项目结构

```
├── artifacts/
│   ├── aba-mobile/          # 前端（React + Vite，移动端优先）
│   │   └── src/
│   │       ├── pages/       # 18 个页面（Home/Accounts/Cards/Transfer/...）
│   │       ├── components/  # 通用组件（BankLogo、ui/ 组件库）
│   │       ├── lib/         # bakongClient/paywayClient/khqr/tts/txnStore 等
│   │       ├── data/        # 账户登记簿（真实户名）
│   │       └── hooks/       # use-mobile/use-toast
│   └── api-server/          # Express 网关（Bakong + ABA PayWay 代理，端口 5200）
│       └── src/
│           ├── routes/      # bakong / payway / health 路由
│           └── lib/         # bakong 与 payway 客户端（密钥全部读自环境变量）
├── lib/                     # 工作区共享包
│   ├── api-zod/             # OpenAPI 生成的 Zod schemas
│   ├── api-client-react/    # OpenAPI 生成的 React Query 客户端
│   ├── api-spec/            # OpenAPI 规范（orval 生成源）
│   └── db/                  # Drizzle ORM（PostgreSQL）
└── scripts/                 # 工具脚本
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动前端（Vite dev）
pnpm --filter @workspace/aba-mobile run dev

# 构建前端
pnpm --filter @workspace/aba-mobile run build

# 启动网关（需先配置 .env，见 artifacts/api-server/.env.example）
cd artifacts/api-server
cp .env.example .env   # 填入真实 BAKONG_TOKEN / PayWay Key
pnpm run dev           # 监听 5200，API 前缀 /api
```

## 环境变量（安全提醒）

- 真实 `BAKONG_TOKEN` 与 PayWay 私钥**绝不可提交到仓库**。
- `.env` 已被 `.gitignore` 排除；仓库只保留脱敏模板 `.env.example`。
- 本地开发默认 `BAKONG_MODE=mock`、`PAYWAY_MODE=mock`，无需真实凭据即可跑通全部流程。

## 线上测试

前端已发布为 doubao 应用（app_17ft86nyrp3）：
https://4m11603uejvke.doubaoapps.com/app/app_17ft86nyrp3

## 说明

- 转账 PIN：1234
- 收款人户名显示规则：只显示登记簿真实名字 / 扫码名 / Bakong 存在性（不伪造户名）
- 语音播报：只念转出金额，不念余额（中文文案「你转出 X 美元的资金，请你确认」）
