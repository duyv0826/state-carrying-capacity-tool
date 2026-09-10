# syntax=docker/dockerfile:1
# 状态承载量自测工具 —— 单进程构建（Node 同时托管前端静态资源 + /api）
# 基础镜像统一用官方 node:22-bookworm：better-sqlite3 13.x 在该镜像有预编译原生二进制，
# 避免 Alpine/musl 缺编译链导致原生模块构建失败。

# ---------- Stage 1: 构建前端 ----------
FROM node:22-bookworm AS build-client
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Stage 2: 构建后端 ----------
FROM node:22-bookworm AS build-server
WORKDIR /server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---------- Stage 3: 运行镜像 ----------
FROM node:22-bookworm AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV CLIENT_DIST=/app/client/dist
ENV PORT=3000
ENV DB_PATH=/app/data/scc.db

# 运行时依赖直接沿用 build-server 阶段已就位的 node_modules（含 better-sqlite3 原生 .node）。
# build-server 与 runtime 同为 node:22-bookworm，ABI 一致，预编译二进制可直接加载。
COPY --from=build-server /server/node_modules ./node_modules
COPY --from=build-server /server/dist ./dist
COPY --from=build-client /client/dist ./client/dist

# SQLite 单文件目录（DB_PATH 默认指向此处）。目录需先存在，否则 better-sqlite3 打开失败。
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "dist/index.js"]
