# WeiMeng Docker Deployment

This directory is used to run WeiMeng with images pulled from Docker Hub.

## Quick Start
1. Create runtime env file:
   `cp .env.example .env`
2. Edit `.env` and set at least:
   - `SECRET_KEY` and database/cache passwords
   - optional: override image tags and exposed ports
3. Pull images and start:
   `docker compose pull && docker compose up -d`
4. Check status:
   `docker compose ps`

## Public Access
- Frontend: `http://<SERVER_PUBLIC_IP_OR_DOMAIN>:5678`
- Backend docs: `http://<SERVER_PUBLIC_IP_OR_DOMAIN>:5607/docs`

If you changed `FRONTEND_PORT` or `API_PORT` in `.env`, use your custom ports.

## Notes
- `web` and `api` are exposed to public network by default.
- `postgres`, `redis`, `minio`, and `elasticsearch` are bound to `127.0.0.1` for safer default deployment.
- Browser requests use same-origin `/api/v1` and are proxied by frontend to `SERVER_API_URL`, so deployments stay portable across servers.
- Ensure cloud/security-group firewall allows inbound traffic to frontend and API ports.
- For domain + TLS deployments, keep `NEXT_PUBLIC_API_URL=/api/v1` and put HTTPS at your ingress/reverse proxy layer.
