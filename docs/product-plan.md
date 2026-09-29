# YSK Kit 產品計劃書（2026-09-29）

狀態：已批核。波 0–1 喺 Phase 39 落地。波 2（薄開倉 + capability 複製）喺 Phase 40 落地。波 3（client shell + seed + Playwright）喺 Phase 41 落地。波 4–5 未做。
範圍：重新審視 kit 目的、開發者點樣快速架構產品、專業化、以及 AI 開發點樣真正受惠。
刻意排除呢一波：Hono、Drizzle、tRPC、Resend、K8s、Tax ID / metered billing、Electron installer、APNs。呢啲係可選 adapter，解決唔到而家最大嘅痛。

---

## 0. 一句結論

YSK Kit 已經證明「合約先行 + hexagonal + 四端」行得通（Phase 1–38，`origin/main` `886abc6`）。下一段價值唔係再加一個 adapter，而係把 kit 由 **裝滿示範能力嘅 living 倉**，變成 **開新產品 15 分鐘就有一條可跑、可測、可俾 AI 跟住抄嘅垂直切片**。

人同 AI 面對嘅係同一個問題：新業務（booking、appointment、listing）應該從邊度開始寫、寫完點掛上 API / SDK / Web、點先唔會破壞 envelope 同分層。而家 `ysk add module` 生出嘅係 `unknown[]` stub，AI 填 stub 時會發明架構。專業化 = 把「正確切片」變成可複製嘅機械動作，再加短法律文件令 agent 唔使讀 800 行 phase 史。

---

## 1. 目的重寫（2026）

### 1.1 原本目的（仍然有效）

`docs/architecture.md` §1 寫嘅係：

每個新產品只寫業務，唔再重做 React 目錄、Express 分層、Prisma、enum/DTO 兩邊各寫一次。Kit 唔係 Express boilerplate，而係 **pnpm + Turborepo 平台 + 可插拔模組 + 合約先行**。

六條原則仍然係法律：

1. `@ysk/contracts` 係唯一真相（enum、DTO、error、path）。
2. 業務核心唔識 Express / Prisma / React。
3. 向下依賴禁止。
4. 預設 REST + OpenAPI（人、手機、partner、agent 都用得）。
5. 模組可加可唔加。
6. 複製業務禁止；複製骨架用 generator。

### 1.2 時代變咗邊度

2024 年「慳兩日砌 Express + Vite」係賣點。2026 年 AI 兩分鐘都可以砌出一個 Express。AI 砌出嚟嘅典型後果：

- TypeScript `enum`、Prisma 從 web import、error 形狀每個 route 唔同
- DTO 前後端各寫一份，一週後漂移
- 權限寫死喺畫面、API 另一套
- 新產品同舊產品無共用 SDK，四端分叉

所以 kit 而家嘅工作係：

| 對象 | Kit 要完成嘅工作 |
|---|---|
| 人類開發者 | 決定已經做完。開倉、DB、auth、CI、envelope、四端 client 唔使再揀。 |
| 產品負責人 | `create-ysk-app --flavor` 對應真實產品形態（saas / gateway / desktop / php-bridge / trading / static-web3）。 |
| AI agent | 法律短、例子完整、越界會被 `pnpm layers` / typecheck / envelope test 捉住。新業務只准由 contract 開始。 |
| 19 個現有 YSK repo | 抽共用、唔合併業務；產品升 kit 有路徑。 |

### 1.3 成功定義（可驗證）

一個唔識 kit 內部、只讀 `AGENTS.md` 嘅人或者 agent，可以喺 **15 分鐘內** 做到：

```text
create-ysk-app my-clinic --flavor saas --preset thin --db mysql
ysk add module appointment --prisma --web
pnpm db:migrate && pnpm test && pnpm layers && pnpm dev
```

結果：

- `GET/POST /v1/appointments` 回 `{ ok, data }` / `{ ok, error }`
- SDK 有 `client.appointments.list/create`
- Web 有一頁 list + create，表單用同一個 Zod schema
- API 有 memory-repo 測試
- `pnpm layers` 綠（web 無 Prisma / Express）
- OpenAPI 有呢條 path

`create-ysk-app --preset thin` 同 `ysk add module` 已存在。Seed / Playwright E2E 喺 Phase 41（波 3）落地。

---

## 2. 依家實際交付咗咩

Living kit（saas flavor）喺 `main`。能力已經齊第一波：

| 層 | 現況 |
|---|---|
| 工具鏈 | pnpm 12.8.1、Node 24、TypeScript 6.0.3、Vitest 5、Biome、Turbo 2.11、CI lint/layers/typecheck/test |
| 合約 | Zod 4 + ts-rest，envelope，OpenAPI + Scalar `/docs` |
| API | Express 5 預設、Fastify 5 可切、Prisma 7 + MariaDB adapter、hexagonal modules |
| 能力 | JWT+OTP、RBAC、audit、files、jobs、mail、notifications、orgs、LLM、push、apikey、crypto、Stripe org billing |
| 客戶端 | Vite 8 web/admin、Expo 57 mobile、Electron 44 desktop |
| 觀測 | pino、Prometheus `/metrics`、OTel traces/metrics、Jaeger/Grafana compose（opt-in） |
| 產生器 | `create-ysk-app` 六個 flavor；`ysk add <capability>`；`ysk add module` |
| 護欄 | dependency-cruiser `pnpm layers`、enum-drift test、API supertest（memory ports） |

呢啲係資產。問題係 **資產嘅入口仍然係「複製成個示範倉」**，而唔係「產生一個薄產品 + 加一條業務切片」。

---

## 3. 真實痛點（帶倉內證據）

### P1. 開新產品 = 複製 fully-loaded demo

`tooling/create-ysk-app/src/scaffold.ts` 用 `copyTree` 複製 kit，SKIP 只有 `node_modules` / `dist` / `.git` / `generated` 等。Flavor 只決定 skip 邊個 app（例如 gateway skip web/mobile/desktop）。

後果：`my-product` 一出世就有 LLM 頁、Stripe billing、orgs、Scalar、Grafana compose。架構 §1 講「模組可加可唔加」，產生器做唔到「可唔加」。開發者第一日做緊嘅係刪嘢，而唔係寫業務。

### P2. `ysk add module` 生出唔能交貨嘅 stub

`tooling/ysk-cli/src/add-module.ts` 而家產出：

- domain port：`list(): Promise<unknown[]>`
- service：直接轉 repo
- router：**只** `mountContract` Express；Fastify 唔知
- contract：`z.array(z.unknown())`，無 DTO
- web：一段「Wire this page to @ysk/sdk」
- Prisma：註解咗嘅 model，唔跑 migrate
- composition：`createXService({ list: async () => [] })`
- **唔寫** SDK resource、web-sdk hooks、測試、OpenAPI regen、`app-fastify.ts`

開發者（同 AI）拿到一堆空檔，仍然要發明分層。Generator 變成假 DX。

### P3. SDK / hooks 係人手表，合約唔會自動去到客戶端

`packages/sdk/src/index.ts` 逐個 resource 手寫。`packages/sdk/src/resources/users.ts` 手寫 path 字串。`packages/web-sdk` 手寫 React Query hooks。

加一條 ts-rest route **唔等於** 四端用到。AI 好自然會喺 page 裏 `fetch('/api/...')`，繞過 envelope unwrap。呢個係四端分叉嘅起點。

### P4. Fastify 係二等公民（對 generator）

手寫模組已經有 `*Handlers` map，`app-fastify.ts` 逐個 import。`ysk add module` 只 patch `apps/api/src/app.ts`。新產品若 `HTTP_ADAPTER=fastify`，產生出嚟嘅 module 404。

### P5. 前端係 demo，唔係可交付殼

- `@ysk/ui` 只有 `button` / `input` / `table` / `Can` / `cn`（`packages/ui/src/`）
- Web 有 login/orgs/billing/llm，無 AppShell、EmptyState、ErrorBanner、Zod FormField
- `apps/web`、`apps/admin` **零** component test
- 無 Playwright：register → login → users 呢條 happy path 無人守
- architecture §11 寫 seed 放 `packages/db-prisma/seeds` —— 倉裏冇呢個目錄。本地 `pnpm dev` 之後無 admin 帳戶，除非人手 register

### P6. Kit → 產品無升級路徑

產生方式係 copy-tree。Kit 修一個 envelope bug，19 個產品倉唔會自動收到。`publishConfig` 指向 GitHub Packages `@ysk` scope，README 寫 owner 要對到 `@ysk`；而家 remote 係 `yanshekki/ysk-kit`。Release workflow 存在，真實對外 publish 未成為日常。

專業公司 kit 嘅核心問題係 **版本傳遞**，而家未設計。

### P7. 文件唔適合人，更加唔適合 AI

- `docs/architecture.md` 開頭 38 段 Phase 史，先至到原則。Agent 上下文被史填滿。
- 目錄樹、桌面 Vite、表前綴 `ysk_`、`IUnitOfWork`、`@ysk/cache` 仍然寫喺 spec，實作已經唔同（表無前綴、`packages/application` 只有 `parsePageQuery` / `slicePage`）。
- 倉內 **零** `AGENTS.md` / `CLAUDE.md` / Cursor rules / skill。Agent 唯一入口係 800+ 行 architecture + README command 表。

### P8. `ysk add <capability>` 對 living kit 多數係 no-op，對薄產品又唔複製源碼

`apply-capability.ts`：merge Prisma fragment、`.env.example`、api workspace dep、string-patch `app.ts` / `composition.ts`。Living saas 用 `skipSourceIf` 當已安裝。**唔**複製 module 源碼樹、**唔** patch `app-fastify.ts` / `main.ts` / `workers.ts`、**唔**跑 migrate。

薄產品若將來存在，加 `jobs` / `llm` 會缺源碼。而家因為 P1（全部都複製咗），呢個洞被遮住。

### P9. AI 開發嘅具體失敗模式（用 kit 而家嘅形狀預測）

若而家叫 agent「加一個 appointment 模組」，大機會：

1. 用 TS `enum`（違反 contracts 規則）
2. 喺 service `new PrismaClient()`（繞過 port）
3. web page 直接 fetch，唔經 `@ysk/sdk`
4. 只改 Express，Fastify 404
5. 漏 `OkSchema`，list 回裸 array
6. 唔加 memory repo，測試打真 MySQL（CI 無 DB）
7. 唔跑 `pnpm layers`

Kit 其實已經有能力捉 2、5、6、7（layers、envelope test、memory ports）。**未交給 agent 一張短法律 + 一個完整範例。** 護欄存在，入口唔存在。

---

## 4. 北星工作流（人同 AI 同一條）

```text
1. 開倉     create-ysk-app <name> --flavor saas|gateway|... --preset thin|full --db mysql|postgresql|sqlite
2. 起基礎設施  docker compose up -d mysql && cp .env.example .env && pnpm db:migrate && pnpm db:seed
3. 加業務     ysk add module <name> --prisma --web
4. 驗證     pnpm lint && pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi
5. 跑       pnpm dev
6. 之後加能力  ysk add jobs|mail|billing|...（連源碼、Express+Fastify、migrate 提示）
```

`--preset full` = 而家 living saas（示範、內部狗食）。
`--preset thin` = health + identity + 空 module 位；其餘用 `ysk add`。

Flavor 仍然決定有邊啲 app，preset 決定有邊啲 **能力**。兩軸分開，先對到架構 §1 同 §16.3。

---

## 5. 工作流同波次

建議五波。每一波獨立可 merge、有驗收。Living kit 保持可跑；唔拆現有 saas 能力。

### 波 0 — 法律文件同真實對齊（專業化入口，1–2 日）

目的：人同 AI 讀完 3 個短檔就知點做，唔使吞 phase 史。

做：

1. 把本文落入 `docs/product-plan.md`。
2. 拆 `docs/architecture.md`：
   - **現行法律**（原則、envelope、分層、flavor、命令、刻意範圍）留喺 `docs/architecture.md`
   - Phase 1–38 史搬去 `docs/history.md`
   - 刪／改已過時句：表前綴 `ysk_`、desktop Vite 8 via electron-vite beta、目錄樹缺 desktop/mobile、`IUnitOfWork` 當已存在、`packages/db-prisma/seeds` 當已存在
3. 新增 `AGENTS.md`（根目錄，≤120 行），內容只得必須遵守：
   - 新 API 先改 `@ysk/contracts`（DTO + ts-rest + `OkSchema`）
   - 禁止 TS `enum`；literal 放 contracts
   - Prisma 只喺 `apps/api/src/modules/*/infra`
   - 客戶端只經 `@ysk/sdk` / `@ysk/web-sdk`
   - 新 module 用 `ysk add module`，跟住補業務，唔好空手發明目錄
   - 提交前：`pnpm layers && pnpm typecheck && pnpm test`
   - envelope 例外白名單（SSE、invoice PDF 302、`/docs`、`/openapi.json`）
4. `CLAUDE.md` 同 `.cursor/rules/ysk-kit.mdc` 指向 `AGENTS.md`（同一份法律，三個入口）。
5. README 加「15 分鐘路徑」段落（即使波 1 未完成，都寫而家真實命令，避免再承諾做唔到嘅 wizard）。

驗收：`architecture.md` 開頭係原則而唔係 Phase 1；`AGENTS.md` 存在；grep 倉內無「electron-vite 6.0.0-beta」當現行事實。

### 波 1 — 黃金切片 + 產生器克隆（解決 P2/P3/P4/P9，最大槓桿）

目的：`ysk add module` 產出嘅檔案，質素接近 `identity` / `organizations`，而唔係 stub。

**黃金切片選 `notes`（刻意非行業）**：id、title、body、authorId、timestamps。Kit 繼續唔寫 salon/trading 業務。放喺 `modules/notes/` 作為可複製範本（living saas **預設唔掛** notes，避免再膨脹 demo）。

範本必須齊呢組檔（對齊現有 hexagonal）：

| 層 | 檔 |
|---|---|
| contracts | `dto/note.ts`、`api/notes.ts`（list + create）、barrel + `appContract` 由 generator 掛 |
| prisma | `modules/notes/prisma/note.prisma` fragment |
| domain | `INoteRepository` |
| application | `createNoteService` |
| infra | prisma repo + **memory repo** + `noteHandlers`（`HttpHandler` map）+ `registerNoteRoutes` Express **同** Fastify |
| sdk | `resources/notes.ts` + `createYskClient().notes` |
| web-sdk | `useNotes` / `useCreateNote` |
| web | `features/notes/notes-page.tsx`：list + 表單，`NoteCreateSchema` 來自 contracts，用 `@ysk/ui` |
| test | API supertest：create → list，envelope；memory repo；`create-ysk-app` test 斷言產生後 Fastify 都掛到 |

`ysk add module <name>` 改為：

1. 克隆 notes 範本，改 ident / path / Prisma model 名
2. 掛 `appContract`、`app.ts`、`app-fastify.ts`、`composition.ts`（已有 `// --- ysk-add:... ---` marker）
3. 加 SDK resource + web-sdk hook + web route（`--web`）
4. merge Prisma fragment（`--prisma`）
5. 印出 `pnpm db:migrate` 同 `pnpm gen:openapi`
6. 產生 API test 檔（memory），CI 一跑就知切片未爛

SDK path 仍然可以手寫，但 **由範本克隆**，唔再叫人發明。波 1 唔做完整 ts-rest→SDK codegen（容易過度設計）；若克隆穩定，波 4 先考慮。

驗收：

```text
ysk add module appointment --prisma --web
pnpm typecheck && pnpm test && pnpm layers
```

- Express 同 `HTTP_ADAPTER=fastify` 都有 `/v1/appointments`
- `client.appointments.create` 存在
- web 有可編譯頁
- 無 `unknown[]`、無「Wire this page」

### 波 2 — 薄開倉（解決 P1/P8）

目的：新產品預設瘦；full 仍然用嚟狗食 kit。

做：

1. `create-ysk-app --preset thin|full`（預設 **thin**；living kit 自己保持 full）
2. thin 包含：monorepo 工具鏈、contracts 核心、identity（register/login/otp/refresh/me）、health/ready/metrics、web login + 空 home、CI、compose、`AGENTS.md`
3. thin **唔包含**：llm、billing、orgs、push、desktop 視 flavor 而定
4. `ysk add team|billing|llm|jobs|...` 要能喺 thin 倉 **複製源碼樹**（而家缺嘅嗰步），並 patch Express+Fastify+composition+env+prisma
5. CI job：喺 tmp 跑 `create-ysk-app ci-smoke --preset thin`，再 `pnpm install && pnpm layers && pnpm typecheck && pnpm test`（證明產生出嚟嘅倉自己站得住）
6. 開倉後印真實 next step（而家有 `pnpm install`；要加 migrate、seed、dev URL）

驗收：thin 倉 `apps/api/src/modules/` 無 `llm` / `billing`；`ysk add llm` 之後有 module + Fastify 掛載；CI smoke 綠。

### 波 3 — 可交付客戶端殼 + seed（解決 P5）

目的：開到 `pnpm dev` 之後，人（同 AI 驗證）可以 login 見到一個專業殼，而唔係「YSK Kit Web / Register or sign in」。

做：

1. `@ysk/ui` 加：`AppShell`、`PageHeader`、`EmptyState`、`ErrorBanner`、`FormField`（接 Zod issue）、`Spinner`
2. web/admin 共用 shell；`<Can>` 用喺 Users 建立／Suspend
3. `pnpm db:seed`：`admin@ysk.hk` + 一個 USER（密碼只喺 `.env.example` 文件說明，hash 用 argon2；production 拒跑除非 `ALLOW_SEED=1`）
4. Playwright **一條** smoke：register 或 seed login → `/users` 見到 envelope 資料（CI 用 sqlite 或 service mysql；跟現有「CI 唔起 Redis/Stripe」—— Playwright 打 API in-process 或者起 sqlite flavor）
5. web 最少一個 Testing Library 測 login 表單：非法 email 用 `LoginPasswordCommandSchema` 出 error

驗收：seed 後 admin 登入；Playwright 綠；UI 元件有 export 同 typecheck。

落地：Phase 41。

### 波 4 — 版本傳遞同專業發佈（解決 P6）

目的：產品倉可以「食」kit 修復，而唔係永遠 fork。

做：

1. 文件寫清兩種消費方式（選一種做預設，另一種保留）：
   - **Template fork**：`create-ysk-app` copy；kit 修復靠 `ysk upgrade`（見下）或者人手 cherry-pick
   - **Packages**：產品自己 apps，`@ysk/contracts` 等從 GitHub Packages 鎖 version
2. 對齊 scope 同 GitHub owner（`@ysk` vs `yanshekki`）——呢個要你定：改 npm scope，或者建 `ysk` org 再 publish
3. `ysk upgrade` 最小版：對對 `AGENTS.md`、`.dependency-cruiser.cjs`、`packages/typescript-config`、envelope helper；**唔**自動改產品 domain
4. 每個產生出嚟嘅 README 印 `generatedFrom: ysk-kit@0.2.0`（kit `package.json` version）
5. Release：changeset 真係 publish 到 GPR 一次（可 restricted），證明路徑，而唔係只得 workflow 檔

驗收：文件有 upgrade 一節；產生倉 README 有 kit version；GPR publish 成功或者明確改為 workspace-only 並刪除誤導句子。

### 波 5 — AI 護欄硬化（解決 P7/P9 嘅量化）

目的：用測試證明「agent 跟 AGENTS.md 加 module 會綠；違反分層會紅」。

做：

1. `docs/recipes/add-module.md`：逐步，對住波 1 命令，含預期檔案樹
2. `tooling/ysk-cli` 加 `ysk check agent`：跑 layers + 抽查 web/admin/mobile import 無 `@prisma` / `express` / `bullmq`
3. **Fixture eval**（純 script，唔使真 LLM CI 費）：把一個故意壞嘅 patch（web import prisma、裸 array response）放 `tooling/agent-fixtures/`，斷言 `pnpm layers` / API test **失敗**；把黃金 `ysk add module` 輸出當正面 fixture **通過**
4. OpenAPI 已有：加一段「AI agent 用 `GET /openapi.json` 發現 path，仍然經 SDK 打，禁止自造 URL」入 `AGENTS.md`
5. 可選後續（唔擋波 5 完成）：MCP resource 讀 `docs/openapi.yaml`——等有真實 agent 工作流先做

驗收：壞 fixture CI 紅、好 fixture CI 綠；`AGENTS.md` + recipe 加埋仍然短。

---

## 6. AI 開發：kit 具體幫到咩、點量

### 6.1 已經幫到（保持）

- **合約先行**：agent 唔使發明 path 同 error code；改 DTO 四面一齊變。
- **Envelope**：`OkSchema` / `ErrSchema` 令 response 形狀穩定，agent tool-calling 解析簡單。
- **`pnpm layers`**：把「web 唔好碰 Prisma」編成機械失敗，比 code review 可靠。
- **Memory ports + Vitest**：CI 無外部服務，agent 可以本地跑測試。
- **OpenAPI + Scalar**：非 TS client、PHP bridge、外部 agent 同一份合約。
- **Composition root**：依賴注入集中，agent 有一個檔可以掛新 service。

### 6.2 而家幫倒忙（要修）

- architecture 太長，agent 讀 Phase 史而漏法律。
- `ysk add module` stub 等於邀請 agent 自由發揮。
- SDK 手寫 → agent 繞過 SDK。
- 無 seed → agent 「驗證 UI」時自己 insert DB，或放棄 E2E。
- Fastify 手掛 → agent 只改佢見到嘅 `app.ts`。

### 6.3 修完之後，AI 工作方式

推薦固定 prompt（寫入 `docs/recipes/add-module.md`）：

```text
Follow AGENTS.md.
Add a <name> module with fields <...>.
Use: pnpm ysk add module <name> --prisma --web
Then fill business rules in application/ + prisma schema.
Do not invent folders. Do not add TypeScript enums.
Run pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi.
```

人嘅工作變成：審業務規則同 UX。架構、envelope、掛載、測試骨架由 kit 做。

呢個先至係「幫 AI 開發」——約束搜索空間，而唔係再寫一篇「請寫乾淨程式」嘅 README。

---

## 7. 專業化清單（對住公司 19 個 repo）

| 項 | 而家 | 目標 |
|---|---|---|
| 開新 TS 產品 | 複製 living saas | `--preset thin` + 黃金 module |
| SlashMap 類四端 | 最接近 kit | 抽升級用波 4 packages；業務留產品倉 |
| PHP 產品 | `php-bridge` flavor 已有 | 保持；OpenAPI 先 |
| Gateway | flavor 已有 | thin+`ysk add apikey`+jobs 先至真係 gateway，而唔係 saas 刪 web |
| 文件 | 一份巨型 architecture | law / history / product-plan / AGENTS / recipe |
| 發佈 | publishConfig + workflow | 真 publish 或承認 workspace-only |
| 品質門檻 | API 單測強、UI 零 E2E | 一條 Playwright + seed |
| 升級 | 無 | `ysk upgrade` 最少護欄檔 |

架構 §14 刻意唔做仍然有效：Nest、Zodios、強制 Next、行業業務入 kit、RN 共用 DOM。

---

## 8. 刻意唔做（呢份計劃書範圍）

- 唔加 Hono / Drizzle / tRPC / Resend / K8s / host-metrics 作為「專業化」
- 唔喺 kit 寫 salon booking、地圖、交易所
- 唔把 living kit 拆到唔可以 `pnpm dev` 狗食
- 唔做完整 ts-rest→SDK 自動 codegen（波 1 用克隆；有證據先再做）
- 唔做 Electron auto-update / APNs / Tax ID（無產品拉先至做）
- 唔引入 Nest 式 `UserService` 三千行
- 唔要求 PHP 產品改寫 Node

---

## 9. 風險

| 風險 | 處理 |
|---|---|
| 克隆 notes 變成第二套要維護嘅業務 | notes 要夠悶、要有測試；改 generator 只改範本一處 |
| thin preset 令 `ysk add` 洞曝光 | 波 2 同「複製源碼樹」綁埋，唔分開 merge |
| Playwright 拉住 CI 外部服務 | smoke 用 sqlite flavor 或 API in-process；仍然唔起 Redis/Stripe |
| GPR scope `@ysk` 同 GitHub user 唔符 | 波 4 先問你：改 scope 定建 org |
| 文件拆分之後 architecture 連結失修 | 波 0 驗收包含 README 連結 |

---

## 10. 建議落地順序

1. 批核呢份計劃書。
2. 實作 **波 0**（文件法律化）+ **波 1**（黃金切片／產生器）——同一週期，因為無黃金切片，AGENTS.md 仍然教人去填 stub。
3. 其後 **波 2**（thin create + CI smoke）。
4. **波 3**（shell + seed + 一條 E2E）。
5. **波 4** 等你決定 GitHub org / npm scope。
6. **波 5** 可以同波 3 平行（fixture 唔依賴 Playwright）。

估計（一個人、跟而家 kit 節奏）：波 0 一日；波 1 兩至三日；波 2 兩日；波 3 兩日；波 4 一日加 org 決策；波 5 一日。

---

## 11. 波 0+1 實作時會動到嘅檔（批核後先改）

- 新增：`docs/product-plan.md`、`docs/history.md`、`AGENTS.md`、`docs/recipes/add-module.md`、`modules/notes/**`、`packages/sdk/src/resources/notes.ts`（範本）、對應 test
- 大改：`tooling/ysk-cli/src/add-module.ts`、`tooling/ysk-cli/src/add-module.test.ts`、`apps/api/src/app-fastify.ts` 掛載方式（marker）、`packages/contracts/src/api/index.ts` 由 generator 維護嘅契約
- 細改：`README.md` / `README.zh.md`、`docs/architecture.md` 拆史、`.cursor/rules`、`CLAUDE.md`
- 驗證：`pnpm lint && pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi`；另加「產生 appointment 再跑一次」script

Living kit 預設仍然 **唔**暴露 notes 路由（範本只供克隆）。狗食用 `ysk add module` 喺 tmp 倉，或者 kit CI smoke。
