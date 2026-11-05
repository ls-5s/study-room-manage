# 校园自习室预约管理系统

毕业设计项目，采用前后端分离架构：Vue 3 + TypeScript + Vite 前端，Node.js + Express + Sequelize 后端，MySQL 数据库。

目前已完成工程搭建、数据库准备和服务状态页面。登录、预约、签到等业务功能尚在开发计划中。

## 项目结构

```text
frontend/    前端页面、路由和请求封装
backend/     后端接口、数据库连接和准备工具
docs/        项目文档与毕业设计选题说明
```

## 本地启动

环境：Node.js 24、pnpm 11.10.0、Docker Desktop。数据库复用已初始化的 `mysql8` 容器，地址为 `127.0.0.1:3306`；执行前确认容器已运行，终端具有 Docker 访问权限。

首次使用，在项目根目录的 PowerShell 中执行：

```powershell
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile

if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }

pnpm --dir backend db:prepare
pnpm dev
```

`db:prepare` 创建 `study_room_manage` 库和 `study_room_app` 账号，保留原有的 `test_db` 和数据卷。首次 `DB_PASSWORD` 可留空，工具会生成密码并保存到 `backend/.env`；重复执行沿用原密码。请保留已有 `.env`，不要覆盖或提交真实凭据。

日常开发只需执行 `pnpm dev`，同时启动前后端，按 `Ctrl+C` 退出。该命令不管理 MySQL。需要单独启动时，分别在两个终端执行：

```powershell
pnpm --dir backend dev
pnpm --dir frontend dev
```

启动后访问 [状态页面](http://localhost:43081/system/status)，查看后端和数据库状态，点击“重新检测”刷新。

## 常用命令

两端都支持以下命令，将 `<工程>` 替换为 `frontend` 或 `backend`：

| 命令 | 用途 |
| --- | --- |
| `pnpm --dir <工程> lint` | 代码规范检查 |
| `pnpm --dir <工程> typecheck` | 类型检查 |
| `pnpm --dir <工程> build` | 构建 |
| `pnpm --dir <工程> format:check` | 格式检查 |
| `pnpm --dir <工程> format` | 格式化代码 |

后端构建后执行 `pnpm --dir backend start`；前端构建后可用 `pnpm --dir frontend preview` 本地预览，仍需单独运行后端。当前未配置自动化测试。

## 开发约定

- 前后端各自维护依赖和锁文件，通过 HTTP JSON 接口通信。
- 前端请求统一从 `frontend/src/utils/request.ts` 发起，API 前缀为 `/api/v1`，超时 15 秒；具体接口放在 `api/`，页面处理加载、错误、重试和取消。
- 后端路由在 `backend/src/routes/index.ts` 汇总，按模块拆分；`app.ts` 配置应用，`server.ts` 负责启动。ESM 源码相对导入使用 `.js` 后缀。
- 前端开发端口固定为 43081，Vite 将 API 请求代理到 `127.0.0.1:43080`；修改后端端口时同步调整代理配置。
- 应用使用专用数据库账号，仅有项目库的增删改查权限；表结构变更需另行管理，不调用 Sequelize `sync()`。
- 管理员凭据只供准备工具使用；`VITE_` 变量会进入浏览器构建结果，只能存放公开配置。

## 当前接口

后端默认地址为 `http://127.0.0.1:43080`，所有响应均为 JSON。

| 接口 | 用途 | 结果 |
| --- | --- | --- |
| `GET /api/v1/health` | 检查 HTTP 服务，不访问数据库 | 200：服务正常 |
| `GET /api/v1/ready` | 使用应用账号检查数据库连接 | 200：连接正常；503：数据库不可用 |

统一响应包含 `code`、`message`、`data`，成功时 `code` 为 `OK`，失败时 `data` 为 `null`。客户端根据 HTTP 状态和 `code` 判断结果，错误信息不包含密码、SQL 或堆栈。

```json
{
  "code": "OK",
  "message": "服务运行正常",
  "data": { "status": "ok" }
}
```

数据库异常不会停止 HTTP 服务，恢复后可重新检测。后端无法连接时，数据库状态显示为未知。

## 常见问题

| 问题 | 排查方法 |
| --- | --- |
| 数据库准备失败 | 检查 Docker 权限、`mysql8` 状态及本地密码；已有账号密码不匹配时恢复原密码，不重建容器或清空数据卷 |
| 后端无法启动 | 检查环境变量、端口配置和端口占用 |
| 页面接口失败 | 确认后端已启动、Vite 代理目标正确；数据库不可用时检查连接配置 |

## 后续开发

登录与角色权限 → 自习室与座位 → 预约与签到 → 违约与反馈 → 统计与导出。
