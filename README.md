# 同频 Tongpin

> 把公司里的工作流，带进小组作业。
>
> 从资料收集、自由讨论，到正式分工、实时进度与交付，一个链接把所有人和每一步收进同一条清晰的工作流。

![同频首页](docs/screenshots/01-landing.png)

## 演示账号

执行 `npm run seed` 后会生成一份完整的中文演示空间：

- 演示发起者：`linche` / `tongpin2026`
- 其他成员：`suyu`、`chenmo`、`zhouye`，密码相同
- 示例项目：「品牌焕新计划」，项目密码 `team2026`
- 项目邀请链接会在种子脚本结束时打印

> 要获得可长期公开访问的地址，请按照下方 [部署](#部署到公网) 一节部署到 Render / Railway / 自己的服务器。

## 核心能力

### 1. 个人账号与个人主页

- 用户名 + 密码注册 / 登录，密码使用 `scrypt` 加盐哈希存储。
- 登录后进入个人工作台，展示进行中项目、已结束项目、待推进任务与个人资料。
- 支持编辑昵称、简介与头像颜色。

### 2. 项目链接 + 密码加入

- 发起者创建项目时设置项目密码，系统生成不可猜测的项目链接。
- 成员通过 `链接 + 项目密码` 加入，项目内容与公开首页完全隔离。
- 发起者可以重置链接、修改密码、将项目结束并归档。
- 每个项目都有前期讨论与正式协作两个阶段。

### 3. 前期讨论与资料收集

- 贴吧式讨论版：发布标题、正文和文件，成员在下方评论。
- 支持 Word、PDF、PPT、Excel、图片、Markdown、压缩包等格式，单文件最大 50MB。
- 图片可直接预览，文档可在线打开或下载。
- 所有讨论、评论和文件在进入正式阶段后完整保留。

### 4. 主动开启正式协作

- 只有发起者可以按下「开启正式协作」按钮。
- 开启后解锁工作台，前期讨论依旧可通过标签页随时回看。
- 正式阶段不能退回准备阶段，避免工作状态被意外重置。

### 5. 成员分工：随机抽取 / 主动分配

- **随机抽取**：填写任务清单，系统尽可能均匀地随机分配给所有成员。
- **主动分配**：指定负责人、截止日期、优先级和职责说明。
- 分工结果会立即进入任务看板，并由负责人更新进度。

### 6. 实时进度与成员工作台

- 每位成员拥有独立工作台：当前状态、正在做的事、负责事项、任务进度、进展时间线、组员留言。
- 成员可以自主设置「专注工作中 / 资料调研中 / 评审中 / 遇到阻塞 / 稍作休息」。
- 任务支持待开始、进行中、待评审、已完成四列看板，进度、状态和备注实时同步。
- SSE 实时推送 + 轮询兜底；重复的进度更新会留痕。
- 项目整体概览：完成率、平均进度、进行中任务与实时动态。

### 7. 置顶通知与共享文档

- 发起者可发布置顶通知，工作台与讨论区同时可见。
- 所有成员可添加在线文档链接（腾讯文档、飞书、Notion、云盘等），集中置顶。
- 支持评论、文件下载和图片灯箱预览。

### 8. 简洁、响应式界面

- 视觉参考 Apple 的克制排版与钉钉的办公信息层级。
- 桌面端四列成员工作台与任务看板，移动端自动重排。
- 不依赖任何前端构建工具或外部 CDN，打开即可用。

![正式协作工作台](docs/screenshots/02-workboard.png)

<details>
<summary>查看成员专属工作台</summary>

![成员工作台](docs/screenshots/03-member-workspace.png)

</details>

<details>
<summary>查看前期讨论版</summary>

![前期讨论](docs/screenshots/04-discussion.png)

</details>

![移动端](docs/screenshots/05-mobile.png)

## 技术栈

- **后端**：Node.js 24 · Express 4 · `node:sqlite`（内置 SQLite，无需额外数据库）
- **前端**：原生 HTML / CSS / JavaScript，无构建步骤、无 CDN
- **数据**：SQLite（会话、项目、成员、任务、评论、通知、链接、动态）+ 本地文件存储
- **实时**：Server-Sent Events，断线自动重连，另有 30 秒轮询兜底
- **安全**：scrypt 密码哈希、HttpOnly 会话 Cookie、项目成员鉴权、速率限制、文件类型/大小限制、CSP、`nosniff`、`X-Frame-Options: DENY`
- **部署**：Dockerfile · Render Blueprint · Railway 配置 · GitHub Actions

## 本地运行

要求 **Node.js 24+**（项目使用 Node 24 内置的 `node:sqlite`）。

```bash
npm install
npm start
```

打开 <http://localhost:3000>。

可选：导入一份完整的中文演示空间（四个成员、讨论、文件、任务、通知、共享文档和实时状态）。

```bash
npm run seed
```

种子脚本会打印演示账号和示例项目链接。演示账号密码均为 `tongpin2026`。

也可以直接注册自己的账号使用。数据默认写入：

```text
data/tongpin.db
uploads/
```

## 部署到公网

### 先说明：为什么不能只用 GitHub Pages

GitHub Pages 只能托管静态文件，无法运行 Node 服务、保存 SQLite 数据、处理登录会话与文件上传。  
本项目已经把 **GitHub 作为源码仓库**，公网运行需要再接入一个支持 Node 与持久化磁盘的平台。推荐：

**GitHub 仓库 → Render（Blueprint）→ 自定义域名**

### 方式一：Render（推荐，带持久化磁盘）

1. 把本目录推送到你的 GitHub 仓库（见下方命令）。
2. 登录 [Render](https://render.com)，选择 **New → Blueprint**，连接该仓库。
3. Render 会读取根目录的 [`render.yaml`](render.yaml)：
   - Node 24
   - `npm install --omit=dev`
   - 自动挂载 1GB 持久化磁盘到 `/var/data`
   - 数据目录 `DATA_DIR=/var/data`，上传目录 `UPLOAD_DIR=/var/data/uploads`
4. 等待部署完成，用 Render 分配的 `https://xxx.onrender.com` 访问。
5. 可选：在 Render 里绑定自己的域名，并在域名服务商处添加 CNAME。

> `render.yaml` 中的磁盘需要 Render 的付费实例（当前为 `starter`）。免费实例没有持久化磁盘，服务重启/重新部署后 SQLite 与上传文件会丢失，只适合临时演示。
>
> 如果不需要示例数据，部署完成后保持空库即可；需要演示数据时，在本地执行：
>
> ```bash
> BASE_URL=https://你的域名 npm run seed
> ```
>
> 这会将示例项目写入线上数据库。请只在演示环境执行。

### 方式二：Railway（Docker + Volume）

1. GitHub 仓库连接到 Railway。
2. Railway 会自动使用根目录的 [`Dockerfile`](Dockerfile)。
3. 添加一个 Volume，挂载到 `/data`。
4. 设置环境变量：
   ```text
   DATA_DIR=/data
   UPLOAD_DIR=/data/uploads
   ```
5. 生成公网域名。

### 方式三：自己的服务器 / Docker

```bash
docker build -t tongpin .
docker run -d \
  --name tongpin \
  -p 3000:3000 \
  -v /srv/tongpin-data:/data \
  -e DATA_DIR=/data \
  -e UPLOAD_DIR=/data/uploads \
  tongpin
```

如果使用 Nginx 反向代理，请将 `/` 全部代理到 `127.0.0.1:3000`，并带上 `X-Forwarded-Proto` 头。SSE 路由需要关闭代理缓冲，服务端已返回 `X-Accel-Buffering: no`。

### 从本地推送到 GitHub

```bash
cd tongpin_2026-11-11
git init
git add .
git commit -m "feat: 同频小组协作空间"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

`.gitignore` 已排除 `node_modules/`、本地数据库、上传文件和 `.env`。

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `DATA_DIR` | `./data` | SQLite 数据目录 |
| `UPLOAD_DIR` | `./uploads` | 文件上传目录 |
| `DB_PATH` | `$DATA_DIR/tongpin.db` | 可单独指定数据库文件 |

健康检查：`GET /api/health`。

## 项目结构

```text
.
├── server.js               # Express API、SQLite schema、鉴权、SSE、文件存储
├── public/
│   ├── index.html          # SPA 外壳
│   ├── app.js              # 路由、页面、交互、实时更新
│   ├── styles.css          # 完整设计系统与响应式布局
│   ├── favicon.svg
│   └── site.webmanifest
├── scripts/seed-demo.mjs   # 可选演示数据
├── docs/screenshots/       # 产品截图
├── data/                   # 本地 SQLite（不提交）
├── uploads/                # 本地上传文件（不提交）
├── Dockerfile
├── render.yaml
├── railway.json
└── .github/workflows/ci.yml
```

## 数据与安全说明

- 项目密码与账号密码都只保存 `scrypt` 哈希，无法找回；忘记项目密码时可由发起者在设置中重设。
- 所有项目接口都会校验当前用户是否为项目成员；文件下载也校验成员身份。
- 项目分享链接可重置，旧链接立即失效；已加入成员不受影响。
- 上传接口只允许白名单扩展名，文件以随机名保存，响应带 `nosniff`，禁止直接作为 HTML 执行。
- CSP 禁止外部脚本；前端无内联 `onclick`。
- 单实例架构：SQLite + 内存中的 SSE 连接表，适合班级/小组规模。若要横向扩容，需迁移到 Postgres/对象存储并引入 Redis 广播。
- 当前版本没有邮箱验证和账号找回流程；正式对外使用前建议补充。
- 备份时同时备份 SQLite 文件和 `uploads/`；使用 Render/Railway 时备份挂载磁盘。

## 测试与检查

```bash
npm run check
```

CI 会自动检查服务端与前端语法，并进行一次服务启动冒烟检查。浏览器端完整流程（注册、建项目、上传、评论、开启正式阶段、随机分工、更新状态、留言、通知、链接、归档）已在 Chrome 桌面与移动视口验证通过。

---

设计与实现：同频 Tongpin · 2026  
License: [MIT](LICENSE)
