🧱 ① 观察类

docker ps # 看容器
docker ps -a
docker logs -f lucky-backend-dev # 看日志

🚪 ② 进容器执行

docker exec -it lucky-backend-dev sh
docker exec -it lucky-backend-dev sh -lc "cd /app && <你的命令>"

⚙️ ③ compose 管理整套服务
docker compose up -d # 启动
docker compose down # 停掉
docker compose restart lucky-backend-dev # 重启后端
docker compose build lucky-backend-dev # 改镜像后重建
