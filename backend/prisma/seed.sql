-- Seed script for initial data (optional)
-- Run with: psql $DATABASE_URL -f prisma/seed.sql

-- Create a demo user (password: demo123)
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'demo-user-id',
  'demo@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Demo User',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
