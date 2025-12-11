# MODEX – Doctor Appointment Booking System

A full-stack appointment booking platform where patients can view available doctor slots and book appointments, while admins manage doctors, time slots, and view bookings in real-time.

## Features

- **Patient View**: Browse available doctor slots, select preferred time within slot window, and book appointments with concurrency control
- **Admin Dashboard**: Create doctors and slots, manage capacity, delete doctors/slots (with cascade), view recent bookings
- **Real-time Sync**: Slots disappear when fully booked; patient view updates every 5 seconds + on window focus
- **Concurrency Safe**: PostgreSQL transactions prevent overbooking even under concurrent requests
- **Responsive UI**: Built with React, React Router, and CSS Grid/Flexbox

## Tech Stack

**Backend**
- Node.js + Express 4.21.2
- TypeScript 5.6.3
- PostgreSQL (pg 8.13.0)
- Zod (validation)

**Frontend**
- React 19.2.0
- React Router 7.10.1
- TypeScript 5.9.3
- Vite 7.2.4
- CSS (no frameworks)

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### Backend

1. **Navigate to backend folder:**
```bash
cd backend
npm install
```

2. **Create `.env` file in `backend/` with:**
```
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/modex
```

3. **Initialize database:**
```bash
psql -U postgres -d postgres -f ../backend/init.sql
```

4. **Run development server:**
```bash
npm run dev
```
Backend runs on `http://localhost:4000/api`

### Frontend

1. **Navigate to frontend folder:**
```bash
cd frontend
npm install
```

2. **Run development server:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

3. **Access the app:**
   - **Patient**: `http://localhost:5173/`
   - **Admin**: `http://localhost:5173/admin`

## Database Setup

Run the SQL init script to create tables:

```bash
psql -U postgres -d postgres -f backend/init.sql
```

This creates:
- `doctors` table (id, name, specialization, created_at)
- `slots` table (id, doctor_id, start_time, end_time, capacity, created_at)
- `bookings` table (id, slot_id, user_name, status, created_at, updated_at)

## Demo Flow

1. **Create a Doctor** (Admin)
   - Go to `/admin`
   - Fill "Create doctor" form, click "Create doctor"
   - Copy the Doctor ID

2. **Create a Slot** (Admin)
   - Paste Doctor ID into "Create slot" form
   - Set start/end time and capacity (e.g., 3)
   - Click "Create slot"

3. **Book an Appointment** (Patient)
   - Go to `/` (home)
   - Click "Book appointment" on any slot
   - Enter your name, select preferred time, click "Confirm booking"
   - See confirmation message

4. **View Bookings** (Admin)
   - Go to `/admin`
   - Scroll to "Recent bookings" table
   - See patient name, doctor, time, and booking timestamp

## API Endpoints

**Public**
- `GET /api/slots` – List all available slots
- `GET /api/slots/:slotId` – Get single slot details
- `POST /api/bookings` – Create a booking

**Admin**
- `POST /api/admin/doctors` – Create doctor
- `GET /api/admin/doctors` – List doctors
- `DELETE /api/admin/doctors/:doctorId` – Delete doctor (cascade)
- `POST /api/admin/slots` – Create slot
- `PATCH /api/admin/slots/:slotId` – Update slot capacity
- `DELETE /api/admin/slots/:slotId` – Delete slot (cascade)

## Build & Production

**Backend:**
```bash
npm run build
npm start
```

**Frontend:**
```bash
npm run build
```

See [DEPLOY.md](./DEPLOY.md) for Render (backend) and Vercel (frontend) deployment instructions.
