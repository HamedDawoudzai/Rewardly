# Rewardly - Loyalty Points System

## Prerequisites

- Node.js (v18 or higher)
- npm

---

## Local Development

### 1. Clone the Repository

git clone https://github.com/BrandanBurgess/RewardlyCSC309
cd RewardlyCSC309

### 2. Start Backend

cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed-all.js
npm start
Backend runs at: `http://localhost:3000`

### 3. Start Frontend

Open a new terminal:

cd frontend
npm install
npm run dev
Frontend runs at: `http://localhost:5173`

### Reset Database (Optional)

To completely delete the database and start fresh:

cd backend
npx prisma migrate reset --force
node prisma/seed-all.js

---

## Production Deployment (Railway)

### Backend Service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm run railway` |

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `${{ secret() }}` (use Railway's secret generator) |
| `FRONTEND_URL` | `frontend-rewardly-production.up.railway.app` |

### Frontend Service

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `VITE_BACKEND_URL` | `backend-rewardly-production.up.railway.app` |

---

## Environment Variables Reference

### Backend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | Yes (production) | `dev-secret-change-in-production` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes (production) | `http://localhost:5173` |
| `PORT` | Server port | No | `3000` |

### Frontend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_BACKEND_URL` | Backend API URL | Yes (production) | Proxied to `localhost:3000` in dev |

---

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** SQLite with Prisma ORM
- **Authentication:** JWT


---

## Demo Accounts

All demo accounts use the password: **`pass`**

| Role | Username | Email | Starting Points |
|------|----------|-------|-----------------|
| **Superuser** | `admin` | admin@test.com | 0 |
| **Manager** | `manager1` | manager1@test.com | 500 |
| **Manager** | `manager2` | manager2@test.com | 300 |
| **Cashier** | `cashier1` | cashier1@test.com | 200 |
| **Cashier** | `cashier2` | cashier2@test.com | 150 |
| **Regular User** | `user1` | user1@test.com | 5,000 |
| **Regular User** | `user2` | user2@test.com | 3,500 |
| **Regular User** | `user3` | user3@test.com | 2,000 |
| **Regular User** | `user4` | user4@test.com | 1,500 |
| **Regular User** | `user5` | user5@test.com | 800 |
| **Regular User** | `user6` | user6@test.com | 250 |
| **Regular User** | `user7`* | user7@test.com | 100 |

*\* user7 is marked as suspicious for testing purposes*

### Promo Codes

| Code | Bonus Points | Description |
|------|--------------|-------------|
| `WELCOME500` | 500 | New member bonus ($10 minimum spend) |
| `LOYAL1000` | 1,000 | Loyalty reward |
| `FIRST100` | 100 | First purchase bonus |
| `REFER300` | 300 | Referral reward |
| `BDAY500` | 500 | Birthday bonus |

---

## URLs

### Local Development

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

### Production (Railway)

| Service | URL |
|---------|-----|
| Frontend | https://frontend-rewardly-production.up.railway.app/ |
| Backend API | https://backend-rewardly-production.up.railway.app |

## Architecture & Technology Stack

### Overview

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | SQLite with Prisma ORM |
| Auth | JWT (JSON Web Tokens), bcrypt |
| Security | Helmet.js, express-rate-limit |