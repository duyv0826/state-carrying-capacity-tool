# 状态承载量自测工具 —— 部署与本地冒烟手册

适用对象：洪兄（产品负责人 / 运维接管人）
适用范围：单进程部署。一个 Node 进程同时托管前端静态资源与 `/api` 后端，无独立前端服务器。
架构约束：部署产物与具体主机解耦——换主机只需改 DNS / 端口映射，代码与镜像零改动。

---

## 1. 本地跑（开发模式，前后端分离）

适合改代码时热更新。两个终端同时开。

终端 A —— 后端（监听 3000）：
```
cd server
npm install
npm run dev
```

终端 B —— 前端（Vite 监听 5173，把 `/api` 代理到 3000）：
```
cd client
npm install
npm run dev
```

浏览器打开 http://localhost:5173 即可使用。前端所有 `/api` 请求经 Vite 代理打到 3000，无需跨域配置。

---

## 2. 本地跑（生产级单进程冒烟）

适合上线前确认"一个进程托管一切"是否真的可用。先构建前端，再构建并启动后端。

```
cd client
npm install
npm run build          # 产出 client/dist（index.html + assets/）

cd ../server
npm install
npm run build          # tsc 产出 server/dist
npm start              # node dist/index.js，监听 3000
```

浏览器打开 http://localhost:3000 即可使用。此时前端静态资源、SPA 深链、API、健康检查全由这一个进程承担。

冒烟通过后停进程：Ctrl+C。

---

## 3. 上云（香港 / 新加坡轻量机，免 ICP 备案）

选香港或新加坡区域，面向境外用户，无需中国大陆 ICP 备案。以下步骤在本机（有 Docker 的主机）构建镜像，再搬到目标机运行；或直接登目标机拉代码后构建。

### 3.1 构建镜像

在仓库根目录（含 Dockerfile 的那一层）执行：
```
docker build -t scc .
```

### 3.2 启动容器

```
docker run -d -p 3000:3000 --name scc -v scc-data:/app/data scc
```

说明：
- `-p 3000:3000`：容器 3000 映射到主机 3000。改端口只动这里，不动代码。
- `-v scc-data:/app/data`：把 SQLite 单文件（`/app/data/scc.db`）挂到具名卷，容器重建不丢数据。不要挂载则数据随容器销毁。

### 3.3 反向代理 + HTTPS

容器只暴露 HTTP 3000。生产环境用反向代理做 HTTPS 终止，不要直接对外暴露 3000 明文。

Caddy 示例（Caddyfile）：
```
your.domain.example {
    reverse_proxy localhost:3000
}
```

Nginx 示例（关键片段）：
```
server {
    listen 443 ssl;
    server_name your.domain.example;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.4 换主机 = 改 DNS / 端口

代码包与镜像零改动。迁移到新机：
1. 新机装 Docker，拉代码或搬镜像。
2. `docker run -d -p 3000:3000 --name scc -v scc-data:/app/data scc`（端口按需改）。
3. 域名 DNS A 记录指向新机公网 IP；反向代理证书按新域名签发。
全程不涉及任何业务代码修改。

---

## 4. 健康检查

探针与本地冒烟统一用独立端点 `/healthz`（不挂在 `/api` 版本号下，便于 LB / 容器探针）：
```
curl -s http://localhost:3000/healthz
```
预期返回：
```
{"ok":true}
```

容器探针可配：
```
liveness: GET /healthz，期望 200
readiness: GET /healthz，期望 200
```

---

## 5. 环境变量（按需设置，未设用代码默认值）

| 变量 | 默认 | 说明 |
|------|------|------|
| COLLECTION_ENABLED | false | 采集总开关。false 时三个采集端点返回成功但零落库（IRB 解耦，零采集也能 100% 用）。 |
| PORT | 3000 | 监听端口。 |
| DB_PATH | ./data/scc.db | SQLite 单文件绝对或相对路径（相对 cwd）。 |
| CORS_ORIGINS | http://localhost:5173 | 允许的前端来源，逗号分隔。生产环境必须改成真实域名，禁止通配。 |
| ADMIN_TOKEN | 空 | 管理员端点令牌（X-Admin-Token 头）。留空则 admin 端点一律 401。 |
| CONTACT_ENCRYPTION_KEY | 空 | 联系方式加密密钥。留空则 /followups 返回 5001。 |
| CONSENT_VERSION | v1.0-2026-09 | 知情同意文本版本。 |
| CONSENT_MODE | implied | 知情同意方式（implied / explicit）。 |
| RAPID_FLAG_THRESHOLD_MS | 12000 | 作答过快阈值（毫秒），低于此值打 rapid 标记。 |

生产启动示例（显式关闭采集、限定来源）：
```
docker run -d -p 3000:3000 --name scc \
  -e COLLECTION_ENABLED=false \
  -e CORS_ORIGINS=https://your.domain.example \
  -v scc-data:/app/data scc
```

---

## 6. 采集开关与 IRB 说明

`COLLECTION_ENABLED` 默认 `false`。含义：
- false：问卷结果照常算分、照常展示，但三个采集端点不写库。产品 100% 可用，零采集。
- 是否开启真实数据采集，由洪兄完成 IRB 备案后决定。备案前保持 false 即可上线交付。

---

## 7. 本地冒烟检查清单（上线前逐项过）

```
# 1) 首页应返回 index.html（含 <div id="root">）
curl -s http://localhost:3000/ | findstr "id=\"root\""

# 2) SPA 深链刷新不应 404，回退到 index.html
curl -s http://localhost:3000/result/abc | findstr "id=\"root\""

# 3) 健康检查
curl -s http://localhost:3000/healthz
# {"ok":true}

# 4) 配置端点：collection_enabled 应为 false，schema_version 应为 2
curl -s http://localhost:3000/api/v1/config

# 5) 合法提交应 201 且总分 safe
curl -s -o nul -w "%{http_code}\n" -X POST http://localhost:3000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d "{\"software_name\":\"TestApp\",\"answers\":[5,1,5,5,1,5,5,5,5],\"strata\":{\"S1\":\"\",\"S2\":\"daily\",\"S3\":\"often\"},\"hp\":\"\",\"schema_version\":2}"

# 6) 蜜罐提交（hp:"bot"）应 200 且不入库
curl -s -o nul -w "%{http_code}\n" -X POST http://localhost:3000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d "{\"software_name\":\"TestApp\",\"answers\":[5,1,5,5,1,5,5,5,5],\"strata\":{\"S1\":\"\",\"S2\":\"daily\",\"S3\":\"often\"},\"hp\":\"bot\",\"schema_version\":2}"
```

第 5 项预期 201，第 6 项预期 200（蜜罐命中，不落库）。

---

## 8. Docker 构建环境说明

本仓库 Dockerfile 为多阶段构建，需在装有 Docker 守护进程的主机执行 `docker build`。
若你当前所在机器没有 Docker 守护进程，在本机无法构建镜像——此时不要卡住：
代码与配置已就绪，到有 Docker 的构建机（或上述香港/新加坡目标机）执行 `docker build -t scc .` 即可。
Windows 本机可用 Docker Desktop 或 WSL2 内的 Docker 守护进程。
