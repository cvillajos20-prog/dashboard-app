-- Run this in the Supabase SQL Editor (the server also creates it automatically on startup)
CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  category    VARCHAR(60)  NOT NULL DEFAULT 'General',
  price       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  quantity    INTEGER       NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
