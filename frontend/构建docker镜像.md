# 进入前端目录
cd frontend

# 构建镜像，标签改为 0.0.1
docker build -t vmengs/weimeng-web:0.0.1 .

# 推送 0.0.1 版本到 Docker Hub
docker push vmengs/weimeng-web:0.0.1