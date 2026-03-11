# WeiMeng Backend

## 源码启动（适用于本地开发或服务器源码部署）
1. 复制环境变量文件：
   ```bash
   cp .env.example .env
   ```
2. 安装依赖：
   ```bash
   uv sync
   ```
3. 启动后端：
   ```bash
   uv run main.py
   # 或
   uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload
   ```

默认监听 `0.0.0.0:5607`，部署到任意服务器后可通过公网 IP/域名访问。

## Docker 部署
- 推荐使用仓库根目录的 `docker/`（适配 Docker Hub 拉取镜像）：
  ```bash
  cd ../docker
  cp .env.example .env
  docker compose pull && docker compose up -d
  ```
- 也可在当前目录使用 `backend/docker-compose.yml` 进行后端单体调试部署。

## 公网访问与跨域
- 健康检查：`http://<SERVER_PUBLIC_IP_OR_DOMAIN>:5607/health`
- 接口文档：`http://<SERVER_PUBLIC_IP_OR_DOMAIN>:5607/docs`
- 跨域通过环境变量控制：
  - `CORS_ALLOW_ORIGINS=*` 表示允许所有来源（默认）
  - 生产建议设置为逗号分隔白名单，例如：
    `CORS_ALLOW_ORIGINS=https://app.example.com,https://admin.example.com`
  - 当使用精确白名单并需要跨域凭据时，设置 `CORS_ALLOW_CREDENTIALS=True`

## 说明
- `SCRIPTS_UPLOAD_MAX_TEXT_LENGTH` 是上传单文件文本长度上限，不是分块参数。
