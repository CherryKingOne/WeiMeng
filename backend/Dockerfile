# 使用轻量级 Python 3.12 镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 安装 uv
RUN pip install --no-cache-dir uv

# 复制 uv 依赖文件
COPY pyproject.toml uv.lock ./

# 使用 uv 安装依赖到系统环境
RUN uv sync --frozen --no-dev --no-install-project

# 复制项目代码
COPY . .

# 暴露端口
EXPOSE 5607

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5607"]
