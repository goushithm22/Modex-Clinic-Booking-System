# Deployment Guide – MODEX

This guide covers deploying MODEX backend to Render and frontend to Vercel.

## Backend – Render Deployment

### 1. Prepare Repository

Ensure your Git repository structure is:
```
modex/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── init.sql
├── frontend/
│   └── ...
└── README.md
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `modex-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid as needed)

### 3. Set Environment Variables

In Render dashboard → Service Settings → **Environment** tab, add:

```
PORT=4000
DATABASE_URL=postgresql://username:password@your-db-host:5432/modex
NODE_ENV=production
```

### 4. Set Up PostgreSQL Database

**Option A: Use Render PostgreSQL**
1. In Render dashboard → **New +** → **PostgreSQL**
2. Create a new database (e.g., `modex-db`)
3. Copy the connection string to `DATABASE_URL` above
4. Run the init script from your local machine or via psql:
   ```bash
   psql $DATABASE_URL < backend/init.sql
   ```

**Option B: Use External Database (AWS RDS, Railway, etc.)**
- Get your database connection string
- Paste into `DATABASE_URL` environment variable
- Run the init script manually

### 5. Deploy

Push to GitHub:
```bash
git add .
git commit -m "Deploy to Render"
git push
```

Render auto-deploys on push. Monitor logs in Render dashboard.

**Backend URL**: `https://modex-backend.onrender.com/api`

---

## Frontend – Vercel Deployment

### 1. Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (Vercel auto-detects)
   - **Output Directory**: `dist`

### 2. Set Environment Variables (if needed)

In Vercel → Project Settings → **Environment Variables**, add:

```
VITE_API_BASE_URL=https://modex-backend.onrender.com/api
```

Then update [frontend/src/appContext.tsx](../frontend/src/appContext.tsx#L61) to use this:
```typescript
const [apiBaseUrl] = useState<string>(process.env.VITE_API_BASE_URL || "http://localhost:4000/api");
```

### 3. Deploy

Push to GitHub:
```bash
git add .
git commit -m "Deploy frontend to Vercel"
git push
```

Vercel auto-deploys. View live site in Vercel dashboard.

**Frontend URL**: `https://modex.vercel.app` (or your custom domain)

---

## Post-Deployment Checklist

- [ ] Backend service is running and healthy (check Render logs)
- [ ] Database is initialized with `init.sql`
- [ ] Frontend can reach backend API (no CORS errors in console)
- [ ] Create a test doctor and slot on admin page
- [ ] Create a test booking on patient page
- [ ] Verify "Recent bookings" appears in admin dashboard
- [ ] Test delete doctor/slot functionality
- [ ] Monitor error logs regularly

## Environment Variables Summary

### Backend (`modex-backend` on Render)
```
PORT=4000
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### Frontend (`modex` on Vercel)
```
VITE_API_BASE_URL=https://modex-backend.onrender.com/api
```

## Troubleshooting

**"Cannot GET /api/slots"**
- Backend is not running or build failed
- Check Render service logs
- Verify `DATABASE_URL` is correct

**"Cannot connect to database"**
- Database URL is wrong or expired
- Database not initialized with `init.sql`
- Firewall/network rules blocking connection

**"CORS error on frontend"**
- Backend CORS not configured for Vercel domain
- Check [backend/src/app.ts](../backend/src/app.ts) CORS origins
- Add your Vercel URL to cors allowlist

**Frontend shows "localhost:4000" errors**
- Update `VITE_API_BASE_URL` in Vercel environment variables
- Rebuild frontend after env change

---

For additional help, consult:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
