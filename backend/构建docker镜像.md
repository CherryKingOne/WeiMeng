# 进入后端目录
cd backend

# 构建 weimeng-api 镜像，标签改为 0.0.1
docker build -t vmengs/weimeng-api:0.0.1 .

# 推送 0.0.1 版本到 Docker Hub
docker push vmengs/weimeng-api:0.0.1
