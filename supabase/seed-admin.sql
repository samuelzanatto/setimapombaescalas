-- Script para promover um usuário existente a admin
-- Execute este SQL no Supabase Dashboard após criar o usuário

-- Primeiro, crie o usuário no Supabase Dashboard:
-- 1. Vá para Authentication > Users
-- 2. Clique em "Add User"
-- 3. Digite: admin@setimapomba.com
-- 4. Defina uma senha temporária
-- 5. Marque "Auto Confirm User"

-- Depois execute este SQL para atualizar o perfil:
UPDATE public.users
SET 
  role = 'admin',
  full_name = 'Administrador',
  username = 'administrador',
  team_function = 'leader'
WHERE email = 'admin@setimapomba.com';

-- Ou se o trigger não criou o usuário automaticamente, insira manualmente:
-- (substitua 'USER_ID_FROM_AUTH' pelo ID do usuário criado)
/*
INSERT INTO public.users (id, email, full_name, username, role, team_function)
SELECT 
  id,
  'admin@setimapomba.com',
  'Administrador',
  'administrador',
  'admin',
  'leader'
FROM auth.users
WHERE email = 'admin@setimapomba.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrador',
  team_function = 'leader';
*/
