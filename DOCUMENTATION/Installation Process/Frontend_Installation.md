# Frontend Installation & Setup Guide

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Target Component:** Frontend Single Page Application (React 19 / Vite 8 / Tailwind CSS v4)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. System Requirements & Prerequisites

Before installing the frontend application, ensure the host environment has the required JavaScript runtime tools installed:

| Tool | Minimum Version | Recommended Version | Description |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.16.0` LTS | `v20.x` LTS or `v22.x` | JavaScript runtime environment |
| **NPM** | `v9.0.0` | `v10.x+` | Node Package Manager |
| **Modern Browser**| Chrome v110+ | Chrome v120+ / Edge v120+ | Web browser with HTML5 Canvas & WebGL support |

---

## 2. Step-by-Step Frontend Installation

### Step 1: Open Terminal & Navigate to Frontend Directory
Open PowerShell or Terminal and change directory to the frontend folder:
```bash
cd c:\CLIENT\GYM\GYM2-CAPSTONE\frontend
```

---

### Step 2: Install Node Dependencies
Execute `npm install` to download all production and development packages declared in `package.json` (React 19, React Router v7, Vite 8, Tailwind CSS v4, Recharts, FullCalendar, Axios, JSMpeg Player, etc.):
```bash
npm install
```

---

### Step 3: Configure Environment Variables (Optional)
If connecting the frontend to a remote or non-default backend API host, create a `.env` file in the `frontend` root:
```ini
VITE_API_BASE_URL=http://localhost:8000/api
VITE_PYTHON_AI_STREAM_URL=http://localhost:5000/video_feed
```

---

### Step 4: Launch Vite Development Server
Start the Vite local development server with network host exposure enabled:
```bash
npm run dev
```
*Output Verification*:
```
  VITE v8.1.1  ready in 280 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.105:5173/
  ➜  press h + enter to show help
```

---

### Step 5: Verify Application Access
Open your web browser and navigate to:
```
http://localhost:5173
```
You will be greeted by the **Double Alpha Fitness Gym Management Portal Login Screen**.

---

## 3. Frontend Build & Production Deployment

To create an optimized, minified production build bundle suitable for deployment to static web hosts or web servers (Nginx/Apache):
```bash
npm run build
```
* The static output assets will be generated inside the `frontend/dist/` directory.

To preview the compiled production build locally:
```bash
npm run preview
```

---

## 4. Installed Frontend Dependencies Reference

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` & `react-dom` | `^19.2.7` | UI component construction |
| `vite` | `^8.1.1` | Lightning-fast build tool & dev server |
| `tailwindcss` | `^4.3.2` | Utility-first CSS styling framework |
| `react-router-dom` | `^7.18.1` | Client-side page routing & navigation |
| `axios` | `^1.18.1` | HTTP requests to Laravel REST API |
| `recharts` | `^3.9.1` | Analytics charts & financial graphs |
| `@fullcalendar/react` | `^6.1.21` | Attendance & workout scheduling calendar |
| `@cycjimmy/jsmpeg-player` | `^6.1.2` | Low-latency canvas video feed streaming |
| `react-avatar-editor` | `^15.1.0` | Profile image cropping during enrollment |

---

## 5. Frontend Troubleshooting Matrix

| Issue / Error Message | Root Cause | Solution |
| :--- | :--- | :--- |
| **`ERR_CONNECTION_REFUSED` (Axios)** | Laravel backend API server is not running on port `8000`. | Start backend server using `php artisan serve` in `backend` folder. |
| **Blank Video Player Feed** | Python AI Flask server is offline or camera unplugged. | Start AI engine using `python gesture_engine.py` in `AI Vision & Gesture Engine` folder. |
| **Tailwind Styles Missing** | Missing `@tailwindcss/vite` plugin compilation. | Verify `vite.config.js` includes `@tailwindcss/vite` plugin and run `npm run dev`. |
| **`oxlint` Linter Warnings** | Minor JavaScript linting warnings. | Run `npm run lint` to review and format code. |
