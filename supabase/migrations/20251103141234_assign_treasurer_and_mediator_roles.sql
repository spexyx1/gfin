/*
  # Assign Treasurer and Mediator Admin Roles

  ## Summary
  Assigns the treasurer and mediator roles to their respective accounts
  and updates their profiles with appropriate permissions and information.

  ## Changes
  1. Update treasurer profile with role information
  2. Update mediator profile with role information
  3. Assign treasurer role
  4. Assign mediator role
  5. Verify assignments

  ## Accounts
  - Treasurer: e2ad1db0-8f62-487c-8219-0b04bbb32caa
  - Mediator: c754da0c-5bd5-4e8c-a414-c2c46417b070
*/

-- Update treasurer profile
UPDATE profiles
SET
  display_name = 'Platform Treasurer',
  bio = 'GHETTO FINANCE Platform Treasury & Token Manager',
  verified = true,
  is_seller = false,
  updated_at = now()
WHERE id = 'e2ad1db0-8f62-487c-8219-0b04bbb32caa';

-- Update mediator profile
UPDATE profiles
SET
  display_name = 'Platform Mediator',
  bio = 'GHETTO FINANCE Dispute Resolution & Mediation Specialist',
  verified = true,
  is_seller = false,
  updated_at = now()
WHERE id = 'c754da0c-5bd5-4e8c-a414-c2c46417b070';

-- Assign treasurer role
INSERT INTO user_admin_roles (user_id, role_type, assigned_by, active)
VALUES (
  'e2ad1db0-8f62-487c-8219-0b04bbb32caa',
  'treasurer'::admin_role_type,
  (SELECT id FROM profiles WHERE username = 'sitemaster'),
  true
)
ON CONFLICT (user_id, role_type) DO UPDATE
SET active = true, assigned_at = now();

-- Assign mediator role
INSERT INTO user_admin_roles (user_id, role_type, assigned_by, active)
VALUES (
  'c754da0c-5bd5-4e8c-a414-c2c46417b070',
  'mediator'::admin_role_type,
  (SELECT id FROM profiles WHERE username = 'sitemaster'),
  true
)
ON CONFLICT (user_id, role_type) DO UPDATE
SET active = true, assigned_at = now();

-- Verify assignments
DO $$
DECLARE
  treasurer_assigned boolean;
  mediator_assigned boolean;
BEGIN
  -- Check treasurer
  SELECT EXISTS(
    SELECT 1 FROM user_admin_roles
    WHERE user_id = 'e2ad1db0-8f62-487c-8219-0b04bbb32caa'
    AND role_type = 'treasurer'
    AND active = true
  ) INTO treasurer_assigned;
  
  -- Check mediator
  SELECT EXISTS(
    SELECT 1 FROM user_admin_roles
    WHERE user_id = 'c754da0c-5bd5-4e8c-a414-c2c46417b070'
    AND role_type = 'mediator'
    AND active = true
  ) INTO mediator_assigned;
  
  IF treasurer_assigned AND mediator_assigned THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admin Roles Assigned Successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Treasurer: treasurer (treasury2025)';
    RAISE NOTICE 'Mediator: mediator (mediate2025)';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Role assignment failed';
  END IF;
END $$;
