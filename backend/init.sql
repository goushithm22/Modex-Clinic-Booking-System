-- MODEX Database Initialization Script
-- Creates tables for doctor appointment booking system

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create slots table
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bookings table with status enum via CHECK constraint
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_slot_status
    ON bookings (slot_id, status);

-- Index for querying active slots
CREATE INDEX IF NOT EXISTS idx_slots_active_start_time
    ON slots (is_active, start_time);

-- Index for querying doctor slots
CREATE INDEX IF NOT EXISTS idx_slots_doctor_id
    ON slots (doctor_id);
