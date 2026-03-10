# WeiMeng Backend

## 环境设置与运行

本项目后端支持使用 `uv` 进行依赖管理。依赖定义在 `pyproject.toml` 中，不依赖 `requirements.txt`。

### 1. 同步依赖

```bash
uv sync
```
此命令会根据 `pyproject.toml` 创建/更新虚拟环境。

剧本库单文件文本字数限制通过 `backend/.env` 中的 `SCRIPTS_UPLOAD_MAX_TEXT_LENGTH` 控制，这个配置用于上传校验，不属于分块参数。

### 2. 运行应用

```bash
uv run main.py
# 或者
uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload
```

### 3. Docker 部署

使用 Docker Compose 在后台启动服务：

```bash
docker compose up -d --build
```

此命令会自动构建镜像并在后台运行所有服务（Backend, PostgreSQL, Redis）。
- `-d`: 在后台运行容器
- `--build`: 启动前重新构建镜像
