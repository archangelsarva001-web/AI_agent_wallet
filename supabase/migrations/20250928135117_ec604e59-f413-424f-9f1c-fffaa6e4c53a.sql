-- Assign admin role to the owner
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) 
VALUES ('0a7c4626-1875-4517-9a20-95f7ac105a34', 'admin', '0a7c4626-1875-4517-9a20-95f7ac105a34', now())
ON CONFLICT (user_id, role) DO NOTHING;