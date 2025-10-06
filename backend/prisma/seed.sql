
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'sejal-demo-id',
  'sejalbhawsar21@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZ1dVQ9z.fQmYp0xM9CZK1oQkXQXq',
  'Sejal Bhawsar',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
