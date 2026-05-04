-- ─── Unique Hospital — Supabase Schema ─────────────────────────────────────
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Appointments Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_name    TEXT NOT NULL,
  phone           TEXT NOT NULL,
  department      TEXT NOT NULL,
  preferred_date  TEXT NOT NULL,
  preferred_time  TEXT NOT NULL,
  symptoms        TEXT DEFAULT '',
  status          TEXT DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CONFIRMED','EMERGENCY','CANCELLED','COMPLETED')),
  session_id      TEXT,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  feedback_sent   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_phone  ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date   ON appointments(preferred_date);

-- Row Level Security (enable for production)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "service_role_all" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

-- ── View: Today's Appointments ──────────────────────────────────────────────
CREATE OR REPLACE VIEW todays_appointments AS
  SELECT * FROM appointments
  WHERE preferred_date = TO_CHAR(NOW(), 'DD-MM-YYYY')
  ORDER BY preferred_time;

-- ── View: Emergency Appointments ───────────────────────────────────────────
CREATE OR REPLACE VIEW emergency_appointments AS
  SELECT * FROM appointments
  WHERE status = 'EMERGENCY'
  ORDER BY created_at DESC;
