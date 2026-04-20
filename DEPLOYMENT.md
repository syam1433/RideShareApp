# RideShare Deployment Guide (Render)

This project runs the Node.js backend and Python YOLO model in the same backend service.

## 1. Architecture

- Frontend: `RideShare/` (Vite app)
- Backend API + Socket.IO: `server/` (Express)
- Python model invoked by Node: `python/Rideshare_Overloading_Detection/main.py`

Because your backend calls Python using `spawn(...)`, deploy Node and Python together in one Render Web Service.

## 2. Frontend Environment

File: `RideShare/.env`

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Production value example:

```env
VITE_BACKEND_URL=https://rideshare-backend.onrender.com
```

## 3. Backend Environment

File: `server/.env`

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
OTP_EXPIRY=5
CLIENT_URL=https://your-frontend-domain.onrender.com
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
PYTHON_BIN=python3
```

Notes:
- Use `PYTHON_BIN=python` locally on Windows if needed.
- Use `PYTHON_BIN=python3` on Render/Linux.

## 4. Deploy Backend On Render (Recommended: Docker)

Your backend runs Node.js and invokes a Python YOLO model. The most reliable Render setup is a single Docker Web Service.

This repo now includes:
- `server/Dockerfile`
- `server/.dockerignore`
- `render.yaml`

The Render Docker build should use the repository root as the build context so the backend can access the top-level `python/` folder.

### Option A: Blueprint deploy (recommended)

1. Push latest code to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select this repository.
4. Render reads `render.yaml` and creates the backend service.

### Option B: Manual web service deploy

1. In Render, click **New +** -> **Web Service**.
2. Select repo and set:
	- Environment: `Docker`
	- Root Directory: `server`
	- Dockerfile Path: `./Dockerfile`
	- Health Check Path: `/`
3. Deploy.

Environment Variables in Render:
- `PORT=10000` (Render default web port)
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `OTP_EXPIRY=5`
- `CLIENT_URL=https://your-frontend-url.onrender.com`
- `GOOGLE_MAPS_API_KEY=...`
- `PYTHON_BIN=python3`
- `CLIENT_URLS=https://ride-share-app-eta.vercel.app,http://localhost:5173`

After deploy, note backend URL (example):
- `https://rideshare-backend.onrender.com`

## 5. Deploy Frontend On Render (Static Site)

Create a Render **Static Site**.

Settings:
- Root Directory: `RideShare`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Environment Variables in Render:
- `VITE_BACKEND_URL=https://rideshare-backend.onrender.com`
- `VITE_GOOGLE_MAPS_API_KEY=...`

## 6. CORS And Connectivity Checklist

Set backend `CLIENT_URL` exactly to your frontend URL (no trailing slash mismatch).

Example:
- Frontend URL: `https://rideshare-frontend.onrender.com`
- Backend `CLIENT_URL`: `https://rideshare-frontend.onrender.com`

Verify after deploy:
- `GET https://<backend>/` returns `{"message":"Server is running"}`
- Frontend login/register calls succeed
- Socket events work (chat/ride updates)
- Overloading detection route works with image upload

## 7. Common Render Issues

1. Python command not found:
- Set `PYTHON_BIN=python3`
- Ensure build command installs Python deps from `requirements.txt`

2. CORS blocked:
- Fix `CLIENT_URL` to exact frontend origin

3. Mongo connection failures:
- Verify `MONGO_URI`
- Allow Render egress IP in MongoDB Atlas network access, or allow from anywhere (`0.0.0.0/0`) if acceptable

4. Large model cold start:
- First overloading request can be slow due to model load; this is expected

## 8. Optional Improvements

1. Add backend health route (`/health`) for Render health checks.
2. Move secrets from local `.env` files to Render env dashboard only.
3. If inference traffic grows, split model into dedicated Python service and call it from Node.
