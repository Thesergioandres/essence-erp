# Railway Deploy Guide (Essence)

## Recommended layout

- One Railway project with two services: `backend` and `frontend`.
- Backend is Node/Express (server).
- Frontend is Vite (client) served as a static site.

## Backend service

- Root: `server`
- Build: `npm install`
- Start: `npm run start`
- Environment variables (minimum):
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT` (Railway injects)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (if enabled)
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (if enabled)
  - `ALLOWED_ORIGINS` (comma-separated frontend origins)
  - `BACKUP_WORKER_DISABLED=true`

## Frontend service (static)

- Root: `client`
- Build: `npm install && npm run build`
- Output: `dist`
- Environment variables:
  - `VITE_API_URL=https://<your-backend>.railway.app/api/v2`

## Notes

- CORS is now driven by `ALLOWED_ORIGINS` and `FRONTEND_URL`.
- The legacy VPS scripts and Docker Compose are not required for Railway.
