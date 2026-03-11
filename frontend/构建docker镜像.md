# 进入前端目录
cd frontend

# 构建镜像
docker build -t vmengs/weimeng-web:0.0.1 .

# 运行镜像（后端在宿主机 5607）
# NEXT_PUBLIC_API_URL: 浏览器侧请求地址
# SERVER_API_URL: 容器内 SSR 请求地址
docker run -d --rm -p 5678:5678 \
  --add-host=host.docker.internal:host-gateway \
  -e NEXT_PUBLIC_API_URL=http://localhost:5607/api/v1 \
  -e SERVER_API_URL=http://host.docker.internal:5607/api/v1 \
  vmengs/weimeng-web:0.0.1

# 如果使用 docker compose（前后端都在 compose 网络）
# web 服务建议设置：
# -e NEXT_PUBLIC_API_URL=http://localhost:5607/api/v1
# -e SERVER_API_URL=http://api:5607/api/v1

# 推送镜像
docker push vmengs/weimeng-web:0.0.1
