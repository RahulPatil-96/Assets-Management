-- ===================================================================
-- SCHEMA RESET
-- ===================================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Enums
-- =========================
CREATE TYPE user_role AS ENUM ('Lab Assistant', 'Lab Incharge', 'HOD');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- =========================
-- Tables
-- =========================

-- 1. Labs table (must be first)
CREATE TABLE labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location text NOT NULL,
  lab_identifier text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. User profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE, -- external auth uid (e.g. supabase auth.uid())
  email text NOT NULL UNIQUE,
  role user_role NOT NULL,
  name text NOT NULL,
  lab_id uuid REFERENCES labs(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Asset types table (managed by HOD)
CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  identifier text NOT NULL UNIQUE, -- e.g. 'PC','PR','NW'
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Assets table
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no serial UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  name_of_supply text NOT NULL,
  asset_type uuid NOT NULL REFERENCES asset_types(id),
  invoice_number text,
  description text,
  rate numeric(10,2) NOT NULL CHECK (rate >= 0),
  total_amount numeric(10,2) GENERATED ALWAYS AS (rate) STORED,
  asset_id text,
  remark text,
  is_consumable boolean DEFAULT false,
  allocated_lab uuid NOT NULL REFERENCES labs(id),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approved_by_lab_incharge uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at_lab_incharge timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Deleted assets table
CREATE TABLE deleted_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  sr_no serial,
  date date NOT NULL DEFAULT CURRENT_DATE,
  name_of_supply text NOT NULL,
  asset_type uuid NOT NULL REFERENCES asset_types(id),
  invoice_number text,
  description text,
  rate numeric(10,2) NOT NULL CHECK (rate >= 0),
  total_amount numeric(10,2) GENERATED ALWAYS AS (rate) STORED,
  asset_id text,
  remark text,
  is_consumable boolean DEFAULT false,
  allocated_lab uuid NOT NULL REFERENCES labs(id),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approved_by_lab_incharge uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at_lab_incharge timestamptz,
  deleted_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz DEFAULT now(),
  hod_approval boolean DEFAULT false,
  hod_approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  hod_approved_at timestamptz,
  restored boolean DEFAULT false,
  restored_at timestamptz,
  restored_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Asset issues table
CREATE TABLE asset_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  issue_description text NOT NULL,
  reported_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reported_at timestamptz DEFAULT now(),
  status issue_status DEFAULT 'open',
  resolved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  remark text,
  cost_required numeric(10,2),
  updated_at timestamptz DEFAULT now()
);

-- 7. Asset transfers table
CREATE TABLE asset_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  from_lab uuid NOT NULL REFERENCES labs(id),
  to_lab uuid NOT NULL REFERENCES labs(id),
  initiated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  initiated_at timestamptz DEFAULT now(),
  approved_by_lab_incharge uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at_lab_incharge timestamptz,
  received_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  received_at timestamptz,
  status transfer_status DEFAULT 'pending',
  updated_at timestamptz DEFAULT now()
);

-- 8. Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  message text,
  is_read boolean DEFAULT FALSE,
  created_at timestamptz DEFAULT now()
);

-- 9. Activity logs table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  request_id text,
  severity_level text CHECK (severity_level IN ('info','warning','error','critical')),
  success boolean DEFAULT TRUE,
  error_message text,
  processing_time_ms integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===================================================================
-- INDEXES
-- ===================================================================
CREATE INDEX idx_user_profiles_auth_id ON user_profiles(auth_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_lab_id ON user_profiles(lab_id);

CREATE INDEX idx_assets_sr_no ON assets(sr_no);
CREATE INDEX idx_assets_allocated_lab ON assets(allocated_lab);
CREATE INDEX idx_assets_approved ON assets(approved);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_created_by ON assets(created_by);

CREATE INDEX idx_asset_issues_asset_id ON asset_issues(asset_id);
CREATE INDEX idx_asset_issues_status ON asset_issues(status);
CREATE INDEX idx_asset_issues_reported_by ON asset_issues(reported_by);

CREATE INDEX idx_asset_transfers_asset_id ON asset_transfers(asset_id);
CREATE INDEX idx_asset_transfers_status ON asset_transfers(status);
CREATE INDEX idx_asset_transfers_from_lab ON asset_transfers(from_lab);
CREATE INDEX idx_asset_transfers_to_lab ON asset_transfers(to_lab);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_entity_type ON notifications(entity_type);
CREATE INDEX idx_notifications_action_type ON notifications(action_type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_severity ON activity_logs(severity_level);

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Utility: Map auth.uid() (external uuid) to user_profiles.id (internal)
CREATE OR REPLACE FUNCTION public.get_profile_id_by_auth(p_auth_id uuid)
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT id FROM public.user_profiles WHERE auth_id = p_auth_id LIMIT 1;
$$;

-- Centralized function to get asset type prefix (now by asset_type id)
CREATE OR REPLACE FUNCTION get_asset_type_prefix(p_asset_type_id uuid)
RETURNS text AS $$
DECLARE
    prefix text;
BEGIN
    SELECT identifier INTO prefix FROM asset_types WHERE id = p_asset_type_id LIMIT 1;

    IF prefix IS NULL THEN
        prefix := 'OT'; -- Default prefix for Other
    END IF;

    RETURN prefix;
END;
$$ LANGUAGE plpgsql;

-- Function to generate asset ID
CREATE OR REPLACE FUNCTION generate_asset_id(lab_identifier text, asset_type_id uuid, asset_number integer)
RETURNS text AS $$
DECLARE
    asset_type_prefix text;
BEGIN
    -- Get asset type prefix from the centralized function
    asset_type_prefix := get_asset_type_prefix(asset_type_id);

    RETURN 'RSCOE/CSBS/' || lab_identifier || '/' || asset_type_prefix || '-' || asset_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update asset_ids when a lab's identifier changes
CREATE OR REPLACE FUNCTION update_asset_ids_for_lab(lab_id uuid, new_lab_identifier text)
RETURNS void AS $$
DECLARE
  asset_row RECORD;
  asset_number integer;
  new_asset_id text;
BEGIN
  FOR asset_row IN SELECT * FROM assets WHERE allocated_lab = lab_id LOOP
    -- Extract asset number from the old asset_id or compute next
    asset_number := COALESCE(
      CAST(SUBSTRING(asset_row.asset_id FROM '.*-(\d+)$') AS INTEGER),
      1
    );
    new_asset_id := generate_asset_id(new_lab_identifier, asset_row.asset_type, asset_number);
    UPDATE assets SET asset_id = new_asset_id WHERE id = asset_row.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set asset_id on insert and recalc on asset_type/allocated_lab update
CREATE OR REPLACE FUNCTION set_asset_id() RETURNS TRIGGER AS $$
DECLARE
    asset_number integer;
    lab_identifier_value text;
    asset_type_prefix text;
BEGIN
    -- Get the lab identifier from the labs table
    SELECT lab_identifier INTO lab_identifier_value 
    FROM labs 
    WHERE id = NEW.allocated_lab;

    -- If lab identifier not found, use the allocated_lab as fallback (uuid text)
    IF lab_identifier_value IS NULL THEN
        lab_identifier_value := NEW.allocated_lab::text;
    END IF;

    -- Determine asset_type_id (NEW.asset_type is uuid)
    -- Get the next asset number for the specific lab and asset type combination
    SELECT COALESCE(MAX(
        CASE 
            WHEN asset_id IS NOT NULL AND asset_id LIKE '%' || lab_identifier_value || '/' || get_asset_type_prefix(NEW.asset_type) || '-%' 
            THEN CAST(SUBSTRING(asset_id FROM '.*-(\d+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO asset_number 
    FROM assets 
    WHERE allocated_lab = NEW.allocated_lab AND asset_type = NEW.asset_type;

    -- Generate the asset ID
    NEW.asset_id := generate_asset_id(lab_identifier_value, NEW.asset_type, asset_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset IDs when lab identifier changes
CREATE OR REPLACE FUNCTION trg_update_asset_ids_on_lab_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lab_identifier IS DISTINCT FROM NEW.lab_identifier THEN
    PERFORM update_asset_ids_for_lab(NEW.id, NEW.lab_identifier);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset_id when allocated_lab or asset_type changes
CREATE OR REPLACE FUNCTION trg_update_asset_id_on_allocated_lab_or_type_change() RETURNS TRIGGER AS $$
DECLARE
    asset_number integer;
    lab_identifier_value text;
BEGIN
    -- Only update if allocated_lab OR asset_type has changed
    IF OLD.allocated_lab IS DISTINCT FROM NEW.allocated_lab OR OLD.asset_type IS DISTINCT FROM NEW.asset_type THEN

        -- Get the lab identifier from the labs table
        SELECT lab_identifier INTO lab_identifier_value
        FROM labs
        WHERE id = NEW.allocated_lab;

        IF lab_identifier_value IS NULL THEN
            lab_identifier_value := NEW.allocated_lab::text;
        END IF;

        -- Get the next asset number for the specific lab and asset type combination
        SELECT COALESCE(MAX(
            CASE
                WHEN asset_id IS NOT NULL AND asset_id LIKE '%' || lab_identifier_value || '/' || get_asset_type_prefix(NEW.asset_type) || '-%'
                THEN CAST(SUBSTRING(asset_id FROM '.*-(\d+)$') AS INTEGER)
                ELSE 0
            END
        ), 0) + 1 INTO asset_number
        FROM assets
        WHERE allocated_lab = NEW.allocated_lab AND asset_type = NEW.asset_type AND id != NEW.id;  -- Exclude self

        NEW.asset_id := generate_asset_id(lab_identifier_value, NEW.asset_type, asset_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile with elevated privileges (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_id uuid,
  p_email text,
  p_role text,  -- will convert to enum
  p_name text,
  p_lab_id uuid
) RETURNS uuid AS $$
DECLARE
  v_profile_id uuid;
  v_valid_role user_role;
BEGIN
  -- Validate and convert the role string to the enum type
  BEGIN
    v_valid_role := p_role::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_valid_role := 'Lab Assistant';
  END;
  
  INSERT INTO user_profiles (auth_id, email, role, name, lab_id)
  VALUES (p_auth_id, p_email, v_valid_role, p_name, p_lab_id)
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create_notification now accepts auth IDs and stores user_profiles.id mapping
CREATE OR REPLACE FUNCTION public.create_notification(
  action_type text,
  entity_id uuid,
  entity_name text,
  entity_type text,
  actor_auth_id uuid,
  target_auth_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text;
  v_actor_profile_id uuid;
  v_target_profile_id uuid;
BEGIN
  -- Build human-readable message
  CASE action_type
    WHEN 'insert'   THEN v_message := 'New ' || entity_type || ' created: ' || entity_name;
    WHEN 'update'   THEN v_message := entity_type || ' updated: ' || entity_name;
    WHEN 'delete'   THEN v_message := entity_type || ' deleted: ' || entity_name;
    WHEN 'transfer' THEN v_message := entity_type || ' transferred: ' || entity_name;
    WHEN 'approve'  THEN v_message := entity_type || ' approved: ' || entity_name;
    WHEN 'reject'   THEN v_message := entity_type || ' rejected: ' || entity_name;
    WHEN 'resolve'  THEN v_message := entity_type || ' resolved: ' || entity_name;
    WHEN 'report'   THEN v_message := 'New ' || entity_type || ' reported: ' || entity_name;
    ELSE                 v_message := 'Action performed on ' || entity_type || ': ' || entity_name;
  END CASE;

  -- Map actor auth uid to user_profiles.id (if present)
  SELECT id INTO v_actor_profile_id FROM user_profiles WHERE auth_id = actor_auth_id LIMIT 1;

  IF target_auth_id IS NOT NULL THEN
    SELECT id INTO v_target_profile_id FROM user_profiles WHERE auth_id = target_auth_id LIMIT 1;

    IF v_target_profile_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message)
      VALUES (v_target_profile_id, v_actor_profile_id, action_type, entity_type, entity_id, entity_name, v_message);
    END IF;
  ELSE
    -- Broadcast to all user_profiles
    INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message)
    SELECT id, v_actor_profile_id, action_type, entity_type, entity_id, entity_name, v_message
    FROM user_profiles;
  END IF;
END;
$$;

-- log_activity: accepts p_user_auth_id (auth.uid()) and maps to user_profiles.id internally
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_auth_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_changes jsonb DEFAULT NULL,
  p_severity_level text DEFAULT 'info',
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_profile_id uuid;
BEGIN
  -- Map auth uid to profile id (if exists)
  SELECT id INTO v_user_profile_id FROM user_profiles WHERE auth_id = p_user_auth_id LIMIT 1;

  -- Insert the activity log (user_id may be NULL if mapping fails)
  INSERT INTO activity_logs (
    user_id, action_type, entity_type, entity_id, entity_name,
    old_values, new_values, changes, severity_level, success, error_message, metadata
  )
  VALUES (
    v_user_profile_id, p_action_type, p_entity_type, p_entity_id, p_entity_name,
    p_old_values, p_new_values, p_changes, p_severity_level, p_success, p_error_message, p_metadata
  )
  RETURNING id INTO v_log_id;

  -- Create notification (actor is the p_user_auth_id)
  PERFORM public.create_notification(
    p_action_type,
    p_entity_id,
    p_entity_name,
    p_entity_type,
    p_user_auth_id,
    NULL
  );

  RETURN v_log_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to log activity: %', SQLERRM;
END;
$$;

-- restore_deleted_asset: now validates and restores using FK asset_type uuid
CREATE OR REPLACE FUNCTION public.restore_deleted_asset(deleted_asset_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_asset RECORD;
  v_auth_id uuid;
  v_user_profile_id uuid;
  v_new_asset_id uuid;
  v_sr_no integer;
BEGIN
  -- Get current user auth ID
  v_auth_id := auth.uid();

  -- Check if user is authenticated
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to restore assets';
  END IF;

  -- Get the user profile ID
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE auth_id = v_auth_id;

  IF v_user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Get the deleted asset data
  SELECT * INTO v_deleted_asset
  FROM deleted_assets
  WHERE id = deleted_asset_id AND restored = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deleted asset not found or already restored';
  END IF;

  -- Check if user has HOD role (only HOD can restore assets)
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = v_user_profile_id AND role = 'HOD'
  ) THEN
    RAISE EXCEPTION 'Only HOD can restore deleted assets';
  END IF;

  -- Get next available sr_no (find max + 1)
  SELECT COALESCE(MAX(sr_no), 0) + 1 INTO v_sr_no FROM assets;

  -- Insert the asset back into assets table
  INSERT INTO assets (
    sr_no,
    date,
    name_of_supply,
    asset_type,
    invoice_number,
    description,
    rate,
    remark,
    is_consumable,
    allocated_lab,
    created_by,
    approved,
    approved_by,
    approved_at,
    approved_by_lab_incharge,
    approved_at_lab_incharge
  )
  VALUES (
    v_sr_no,
    v_deleted_asset.date,
    v_deleted_asset.name_of_supply,
    v_deleted_asset.asset_type,
    v_deleted_asset.invoice_number,
    v_deleted_asset.description,
    v_deleted_asset.rate,
    v_deleted_asset.remark,
    v_deleted_asset.is_consumable,
    v_deleted_asset.allocated_lab,
    v_deleted_asset.created_by,
    v_deleted_asset.approved,
    v_deleted_asset.approved_by,
    v_deleted_asset.approved_at,
    v_deleted_asset.approved_by_lab_incharge,
    v_deleted_asset.approved_at_lab_incharge
  )
  RETURNING id INTO v_new_asset_id;

  -- Update the deleted_assets record to mark as restored
  UPDATE deleted_assets
  SET
    restored = true,
    restored_at = now(),
    restored_by = v_user_profile_id,
    updated_at = now()
  WHERE id = deleted_asset_id;

  -- Log the restoration activity
  PERFORM log_activity(
    v_auth_id,
    'restore',
    'asset',
    v_new_asset_id,
    v_deleted_asset.name_of_supply,
    NULL,
    NULL,
    NULL,
    'info',
    true,
    NULL,
    jsonb_build_object('original_deleted_asset_id', deleted_asset_id)
  );

  -- Return the new asset ID
  RETURN v_new_asset_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to restore asset: %', SQLERRM;
END;
$$;

-- update_user_password -> uses auth admin update (keeps behavior); requires proper service role on DB
CREATE OR REPLACE FUNCTION public.update_user_password(p_auth_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Check if the current user has admin privileges (HOD role)
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_id = auth.uid() AND role = 'HOD'
  ) THEN
    RAISE EXCEPTION 'Only HOD can update user passwords';
  END IF;

  -- Get the user's email for potential password reset
  SELECT email INTO v_user_email
  FROM user_profiles
  WHERE auth_id = p_auth_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Try to update password using admin API (requires service role)
  BEGIN
    PERFORM auth.admin_update_user_by_id(p_auth_id, jsonb_build_object('password', p_new_password));
  EXCEPTION
    WHEN undefined_function THEN
      RAISE EXCEPTION 'Admin API not available. Password updates require server-side implementation with service role key.';
    WHEN insufficient_privilege THEN
      RAISE EXCEPTION 'Insufficient privileges to update user password. Service role key required.';
    WHEN others THEN
      RAISE EXCEPTION 'Failed to update user password: %', SQLERRM;
  END;
END;
$$;

-- update_user_profile -> HOD only (unchanged logic but keep auth.uid() mapping)
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id uuid,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_lab_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_role user_role;
  v_valid_role user_role;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Check if the current user has HOD role
  SELECT role INTO v_current_user_role
  FROM user_profiles
  WHERE auth_id = auth.uid();

  IF v_current_user_role != 'HOD' THEN
    RAISE EXCEPTION 'Only HOD can update user profiles';
  END IF;

  -- Validate and convert the role string to the enum type if provided
  IF p_role IS NOT NULL THEN
    BEGIN
      v_valid_role := p_role::user_role;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid role: %', p_role;
    END;
  END IF;

  -- Get old data for logging
  SELECT to_jsonb(user_profiles) INTO v_old_data
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update the user profile
  UPDATE user_profiles
  SET
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    role = COALESCE(v_valid_role, role),
    lab_id = p_lab_id,
    updated_at = now()
  WHERE id = p_user_id;

  -- Get new data for logging
  SELECT to_jsonb(user_profiles) INTO v_new_data
  FROM user_profiles
  WHERE id = p_user_id;

  -- Log the update activity
  PERFORM log_activity(
    auth.uid(),
    'update',
    'user_profile',
    p_user_id,
    COALESCE(p_name, v_old_data->>'name'),
    v_old_data,
    v_new_data,
    get_jsonb_diff(v_old_data, v_new_data),
    'info',
    true,
    NULL,
    jsonb_build_object('updated_by_hod', true)
  );

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to update user profile: %', SQLERRM;
END;
$$;

-- delete_user_profile -> HOD only (unchanged logic but mapping)
CREATE OR REPLACE FUNCTION public.delete_user_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_role user_role;
  v_user_auth_id uuid;
  v_user_name text;
  v_user_email text;
  v_old_data jsonb;
  v_related_records jsonb := '{}';
BEGIN
  -- Check if the current user has HOD role
  SELECT role INTO v_current_user_role
  FROM user_profiles
  WHERE auth_id = auth.uid();

  IF v_current_user_role != 'HOD' THEN
    RAISE EXCEPTION 'Only HOD can delete user profiles';
  END IF;

  -- Get user details for logging
  SELECT auth_id, name, email, to_jsonb(user_profiles) INTO v_user_auth_id, v_user_name, v_user_email, v_old_data
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check for related records that would prevent deletion
  SELECT jsonb_build_object(
    'assets_created', (SELECT COUNT(*) FROM assets WHERE created_by = p_user_id),
    'assets_approved', (SELECT COUNT(*) FROM assets WHERE approved_by = p_user_id),
    'assets_approved_lab_incharge', (SELECT COUNT(*) FROM assets WHERE approved_by_lab_incharge = p_user_id),
    'issues_reported', (SELECT COUNT(*) FROM asset_issues WHERE reported_by = p_user_id),
    'issues_resolved', (SELECT COUNT(*) FROM asset_issues WHERE resolved_by = p_user_id),
    'transfers_initiated', (SELECT COUNT(*) FROM asset_transfers WHERE initiated_by = p_user_id),
    'transfers_approved', (SELECT COUNT(*) FROM asset_transfers WHERE approved_by_lab_incharge = p_user_id),
    'transfers_received', (SELECT COUNT(*) FROM asset_transfers WHERE received_by = p_user_id),
    'notifications_sent', (SELECT COUNT(*) FROM notifications WHERE actor_id = p_user_id),
    'activity_logs', (SELECT COUNT(*) FROM activity_logs WHERE user_id = p_user_id)
  ) INTO v_related_records;

  -- Log the deletion activity with related records info
  PERFORM log_activity(
    auth.uid(),
    'delete',
    'user_profile',
    p_user_id,
    v_user_name,
    v_old_data,
    NULL,
    NULL,
    'warning',
    true,
    NULL,
    jsonb_build_object('related_records', v_related_records, 'deleted_by_hod', true)
  );

  -- Delete the user profile
  DELETE FROM user_profiles WHERE id = p_user_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to delete user profile: %', SQLERRM;
END;
$$;

-- JSONB diff helper
CREATE OR REPLACE FUNCTION public.get_jsonb_diff(old_data jsonb, new_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  key text;
  old_val jsonb;
  new_val jsonb;
BEGIN
  FOR key IN (
    SELECT DISTINCT k FROM (
      SELECT jsonb_object_keys(old_data) AS k
      UNION
      SELECT jsonb_object_keys(new_data) AS k
    ) keys
  )
  LOOP
    old_val := old_data -> key;
    new_val := new_data -> key;

    IF old_val IS DISTINCT FROM new_val THEN
      result := result || jsonb_build_object(
        key,
        jsonb_build_object('old', old_val, 'new', new_val)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

-- Trigger function for user_profiles table (audit)
CREATE OR REPLACE FUNCTION trg_user_profiles_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_auth_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
BEGIN
  -- Get actor auth id from current session
  v_actor_auth_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_auth_id,
      'insert',
      'user_profile',
      NEW.id,
      NEW.name || ' (' || NEW.email || ')',
      NULL,
      v_new_data,
      NULL,
      'info',
      true
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    PERFORM log_activity(
      v_actor_auth_id,
      'update',
      'user_profile',
      NEW.id,
      NEW.name || ' (' || NEW.email || ')',
      v_old_data,
      v_new_data,
      v_changes,
      'info',
      true
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_auth_id,
      'delete',
      'user_profile',
      OLD.id,
      OLD.name || ' (' || OLD.email || ')',
      v_old_data,
      NULL,
      NULL,
      'warning',
      true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function for assets table
CREATE OR REPLACE FUNCTION trg_assets_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_auth_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
BEGIN
  v_actor_auth_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_auth_id,
      'insert',
      'asset',
      NEW.id,
      NEW.name_of_supply,
      NULL,
      v_new_data,
      NULL,
      'info',
      true
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    IF OLD.approved = false AND NEW.approved = true THEN
      PERFORM log_activity(
        v_actor_auth_id,
        'approve',
        'asset',
        NEW.id,
        NEW.name_of_supply,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    ELSE
      PERFORM log_activity(
        v_actor_auth_id,
        'update',
        'asset',
        NEW.id,
        NEW.name_of_supply,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_auth_id,
      'delete',
      'asset',
      OLD.id,
      OLD.name_of_supply,
      v_old_data,
      NULL,
      NULL,
      'warning',
      true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function for asset_issues
CREATE OR REPLACE FUNCTION trg_asset_issues_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_auth_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
  v_asset_name text;
BEGIN
  v_actor_auth_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    SELECT name_of_supply INTO v_asset_name FROM assets WHERE id = NEW.asset_id;
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_auth_id,
      'report',
      'issue',
      NEW.id,
      COALESCE(v_asset_name, 'Unknown Asset'),
      NULL,
      v_new_data,
      NULL,
      'warning',
      true
    );

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);

    IF OLD.status = 'open' AND NEW.status = 'resolved' THEN
      PERFORM log_activity(
        v_actor_auth_id,
        'resolve',
        'issue',
        NEW.id,
        NEW.issue_description,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    ELSE
      PERFORM log_activity(
        v_actor_auth_id,
        'update',
        'issue',
        NEW.id,
        NEW.issue_description,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT name_of_supply INTO v_asset_name FROM assets WHERE id = OLD.asset_id;
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_auth_id,
      'delete',
      'issue',
      OLD.id,
      COALESCE(v_asset_name, 'Unknown Asset'),
      v_old_data,
      NULL,
      NULL,
      'warning',
      true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function for asset_transfers
CREATE OR REPLACE FUNCTION trg_asset_transfers_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_auth_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
  v_asset_name text;
BEGIN
  v_actor_auth_id := auth.uid();
  SELECT name_of_supply INTO v_asset_name FROM assets WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);

  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_auth_id,
      'transfer',
      'transfer',
      NEW.id,
      COALESCE(v_asset_name, 'Asset Transfer'),
      NULL,
      v_new_data,
      NULL,
      'info',
      true
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);

    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      PERFORM log_activity(
        v_actor_auth_id,
        'approve',
        'transfer',
        NEW.id,
        COALESCE(v_asset_name, 'Asset Transfer'),
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    ELSIF OLD.status = 'approved' AND NEW.status = 'received' THEN
      PERFORM log_activity(
        v_actor_auth_id,
        'receive',
        'transfer',
        NEW.id,
        COALESCE(v_asset_name, 'Asset Transfer'),
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    ELSE
      PERFORM log_activity(
        v_actor_auth_id,
        'update',
        'transfer',
        NEW.id,
        COALESCE(v_asset_name, 'Asset Transfer'),
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_auth_id,
      'delete',
      'transfer',
      OLD.id,
      COALESCE(v_asset_name, 'Asset Transfer'),
      v_old_data,
      NULL,
      NULL,
      'warning',
      true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- TRIGGERS
-- ===================================================================
CREATE TRIGGER trg_assets_set_asset_id
  BEFORE INSERT ON assets
  FOR EACH ROW EXECUTE FUNCTION set_asset_id();

CREATE TRIGGER trg_update_asset_ids_on_lab_change
  AFTER UPDATE OF lab_identifier ON labs
  FOR EACH ROW EXECUTE FUNCTION trg_update_asset_ids_on_lab_change();

CREATE TRIGGER trg_update_asset_id_on_allocated_lab_or_type_change
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION trg_update_asset_id_on_allocated_lab_or_type_change();

CREATE TRIGGER trg_user_profiles_audit 
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION trg_user_profiles_audit();

CREATE TRIGGER trg_assets_audit 
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION trg_assets_audit();

CREATE TRIGGER trg_asset_issues_audit 
  AFTER INSERT OR UPDATE OR DELETE ON asset_issues
  FOR EACH ROW EXECUTE FUNCTION trg_asset_issues_audit();

CREATE TRIGGER trg_asset_transfers_audit 
  AFTER INSERT OR UPDATE OR DELETE ON asset_transfers
  FOR EACH ROW EXECUTE FUNCTION trg_asset_transfers_audit();

-- Timestamp update triggers
CREATE TRIGGER trg_up_user_profiles BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_up_assets BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_up_asset_issues BEFORE UPDATE ON asset_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_up_asset_transfers BEFORE UPDATE ON asset_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_up_asset_types BEFORE UPDATE ON asset_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_up_deleted_assets BEFORE UPDATE ON deleted_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;       -- enabled
ALTER TABLE deleted_assets ENABLE ROW LEVEL SECURITY;    -- enabled

-- labs: Allow authenticated users to select all labs
CREATE POLICY labs_select_all ON labs
  FOR SELECT USING (true);

-- labs: Allow authenticated users to create labs
CREATE POLICY labs_insert_all ON labs
  FOR INSERT WITH CHECK (true);

-- labs: Allow authenticated users to update labs
CREATE POLICY labs_update_all ON labs
  FOR UPDATE USING (true) WITH CHECK (true);

-- labs: Allow authenticated users to delete labs
CREATE POLICY labs_delete_all ON labs
  FOR DELETE USING (true);

-- user_profiles: All authenticated users can see all profiles
CREATE POLICY user_profiles_select_all ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY user_profiles_insert_admin ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY user_profiles_insert_system ON user_profiles
  FOR INSERT WITH CHECK (true);

-- asset_types: select allowed to all authenticated
CREATE POLICY asset_types_select_all ON asset_types
  FOR SELECT USING (true);

-- Only HODs can insert/update/delete asset types
CREATE POLICY asset_types_write_hod ON asset_types
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_id = auth.uid() AND role = 'HOD'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_id = auth.uid() AND role = 'HOD'
    )
  );

-- assets: All users can see all assets
CREATE POLICY assets_all ON assets
  FOR SELECT USING (true);

-- assets: Insert allowed if user's lab_id matches allocated_lab
CREATE POLICY assets_insert_authenticated ON assets
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT lab_id FROM user_profiles WHERE auth_id = auth.uid()) = allocated_lab
  );

-- assets: Allow update and delete only if user is Lab Assistant and matches lab
CREATE POLICY assets_update_lab_assistant ON assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'Lab Assistant'
        AND lab_id = assets.allocated_lab
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'Lab Assistant'
        AND lab_id = assets.allocated_lab
    )
  );

-- assets: Allow update for HOD (can approve any asset)
CREATE POLICY assets_update_hod ON assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'HOD'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'HOD'
    )
  );

-- assets: Allow update for Lab Incharge (can approve assets in their lab)
CREATE POLICY assets_update_lab_incharge ON assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'Lab Incharge'
        AND lab_id = assets.allocated_lab
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'Lab Incharge'
        AND lab_id = assets.allocated_lab
    )
  );

-- assets: Allow delete for HOD (can delete any asset)
CREATE POLICY assets_delete_hod ON assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'HOD'
    )
  );

-- assets: Allow delete for Lab Incharge (can delete assets in their lab)
CREATE POLICY assets_delete_lab_incharge ON assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'Lab Incharge'
        AND lab_id = assets.allocated_lab
    )
  );

-- asset_issues: All users can see all issues
CREATE POLICY issues_all ON asset_issues
  FOR SELECT USING (true);

-- asset_issues: Allow insert for authenticated users
CREATE POLICY issues_insert ON asset_issues
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- asset_issues: Allow update only if user is Lab Assistant and user's lab_id matches asset's allocated_lab
CREATE POLICY issues_update_lab_assistant ON asset_issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN assets a ON a.id = asset_issues.asset_id
      WHERE up.auth_id = auth.uid()
        AND up.role = 'Lab Assistant'
        AND up.lab_id = a.allocated_lab
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN assets a ON a.id = asset_issues.asset_id
      WHERE up.auth_id = auth.uid()
        AND up.role = 'Lab Assistant'
        AND up.lab_id = a.allocated_lab
    )
  );

-- asset_issues: Allow delete for HOD (can delete any issue)
CREATE POLICY issues_delete_hod ON asset_issues
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role = 'HOD'
    )
  );

-- asset_issues: Allow delete for Lab Incharge (can delete issues in their lab)
CREATE POLICY issues_delete_lab_incharge ON asset_issues
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN assets a ON a.id = asset_issues.asset_id
      WHERE up.auth_id = auth.uid()
        AND up.role = 'Lab Incharge'
        AND up.lab_id = a.allocated_lab
    )
  );

-- asset_transfers: All users can see all transfers
CREATE POLICY transfers_all ON asset_transfers
  FOR ALL USING (true) WITH CHECK (true);

-- notifications: All users can see their notifications; keep demonstration simple: allow selecting all
CREATE POLICY notifications_all ON notifications
  FOR SELECT USING (true);

-- activity_logs: restrict insert/update via functions only - SELECT open to service_role/admins in app
CREATE POLICY logs_all_select ON activity_logs
  FOR SELECT USING (true);

-- deleted_assets: select allowed for authenticated (could be restricted further)
CREATE POLICY deleted_assets_select_all ON deleted_assets
  FOR SELECT USING (true);

-- deleted_assets: Insert allowed for authenticated users (when deleting an asset)
CREATE POLICY deleted_assets_insert_authenticated ON deleted_assets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- deleted_assets: Update and approve only by HOD or Lab Incharge
CREATE POLICY deleted_assets_update_roles ON deleted_assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role IN ('HOD','Lab Incharge')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid()
        AND role IN ('HOD','Lab Incharge')
    )
  );

-- deleted_assets: Delete only by HOD
CREATE POLICY deleted_assets_delete_hod ON deleted_assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_id = auth.uid() AND role = 'HOD'
    )
  );

-- ===================================================================
-- GRANTS
-- ===================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on important functions to authenticated and anon where appropriate
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(text, uuid, text, text, uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, text, jsonb, jsonb, jsonb, text, boolean, text, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.restore_deleted_asset(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_profile(uuid) TO authenticated;

-- ===================================================================
-- SAMPLE DATA
-- ===================================================================

-- Insert sample asset types
INSERT INTO asset_types (name, identifier, created_by) VALUES
('CPU', 'PC', NULL),
('Printer', 'PR', NULL),
('Network Equipment', 'NW', NULL),
('Peripheral', 'PE', NULL),
('Microcontroller', 'MC', NULL),
('Monitor', 'MO', NULL),
('Mouse', 'MS', NULL),
('Keyboard', 'KB', NULL),
('Scanner', 'SC', NULL),
('Projector', 'PJ', NULL),
('Laptop', 'LP', NULL),
('Other', 'OT', NULL);

-- Insert sample labs
INSERT INTO labs (name, description, location, lab_identifier, created_at, updated_at) VALUES
('Computer Science Lab 01', 'Main computer lab with 50 workstations and servers', 'Building A, Room 101', 'CSLAB01', '2024-01-15T10:00:00Z', '2024-03-20T14:30:00Z'),
('Mechanical Engineering Lab', 'Advanced mechanical engineering research lab', 'Building B, Room 205', 'MELAB01', '2024-02-10T09:15:00Z', '2024-03-25T11:45:00Z'),
('Electronics Workshop', 'Electronics design and prototyping lab', 'Building C, Room 310', 'ELECLAB01', '2024-01-20T14:20:00Z', '2024-03-18T16:10:00Z'),
('Physics Laboratory', 'Modern physics lab with specialized equipment', 'Building D, Room 115', 'PHYSLAB01', '2024-03-05T11:30:00Z', '2024-03-22T13:25:00Z'),
('Chemistry Research Center', 'Chemistry research facility with fume hoods', 'Building E, Room 420', 'CHEMLAB01', '2024-01-08T08:45:00Z', '2024-03-28T10:15:00Z');

-- Insert sample user profiles
INSERT INTO user_profiles (auth_id, email, role, name, lab_id) VALUES
('e078b459-f866-44a9-8127-fc3bcb778770', 'hod@university.edu', 'HOD', 'Dr. John Smith', NULL),
('541bb60e-5a34-49a3-8409-16cffda1c6a4', 'alice.johnson@university.edu', 'Lab Assistant', 'Alice Johnson', (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01')),
('1cf5e152-3095-4d71-9b63-1fa5f7ac17c4', 'robert.williams@university.edu', 'Lab Incharge', 'Prof. Robert Williams', (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01')),
('88707405-9741-4cce-8ed4-3b51eaa41ca7', 'bob.davis@university.edu', 'Lab Assistant', 'Bob Davis', (SELECT id FROM labs WHERE lab_identifier = 'MELAB01')),
('20d6668d-17af-4135-b714-9cdc77d1e327', 'sarah.miller@university.edu', 'Lab Incharge', 'Dr. Sarah Miller', (SELECT id FROM labs WHERE lab_identifier = 'MELAB01')),
('3f8e4c2a-7b9d-4e1f-8a6c-5d2b3f4e5a6b', 'mike.wilson@university.edu', 'Lab Assistant', 'Mike Wilson', (SELECT id FROM labs WHERE lab_identifier = 'ELECLAB01')),
('4a7b5c8d-9e2f-4a3b-8c7d-6e4f5a8b9c0d', 'lisa.brown@university.edu', 'Lab Incharge', 'Dr. Lisa Brown', (SELECT id FROM labs WHERE lab_identifier = 'ELECLAB01')),
('5b8c6d9e-0f3a-4b5c-9d8e-7f5a6b9c0d1e', 'david.lee@university.edu', 'Lab Assistant', 'David Lee', (SELECT id FROM labs WHERE lab_identifier = 'PHYSLAB01')),
('6c9d7e0f-1a4b-5c6d-0e9f-8a6b7c0d1e2f', 'anna.garcia@university.edu', 'Lab Incharge', 'Prof. Anna Garcia', (SELECT id FROM labs WHERE lab_identifier = 'PHYSLAB01')),
('7d0e8f1a-2b5c-6d7e-1f0a-9b7c8d0e1f2a', 'james.taylor@university.edu', 'Lab Assistant', 'James Taylor', (SELECT id FROM labs WHERE lab_identifier = 'CHEMLAB01')),
('8e1f9a2b-3c6d-7e8f-2a1b-0c8d9e1f2a3b', 'maria.rodriguez@university.edu', 'Lab Incharge', 'Dr. Maria Rodriguez', (SELECT id FROM labs WHERE lab_identifier = 'CHEMLAB01'));

-- Additional dummy data for lab assistants and lab incharges (for testing)
INSERT INTO user_profiles (auth_id, email, role, name, lab_id) VALUES
('9f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'assistant.cs@university.edu', 'Lab Assistant', 'John Assistant', (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01')),
('0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'incharge.cs@university.edu', 'Lab Incharge', 'Dr. Jane Incharge', (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01')),
('1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'assistant.me@university.edu', 'Lab Assistant', 'Mike Assistant', (SELECT id FROM labs WHERE lab_identifier = 'MELAB01')),
('2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'incharge.me@university.edu', 'Lab Incharge', 'Prof. Mary Incharge', (SELECT id FROM labs WHERE lab_identifier = 'MELAB01')),
('3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'assistant.el@university.edu', 'Lab Assistant', 'Alex Assistant', (SELECT id FROM labs WHERE lab_identifier = 'ELECLAB01')),
('4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'incharge.el@university.edu', 'Lab Incharge', 'Dr. Sam Incharge', (SELECT id FROM labs WHERE lab_identifier = 'ELECLAB01')),
('5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c', 'assistant.ph@university.edu', 'Lab Assistant', 'Chris Assistant', (SELECT id FROM labs WHERE lab_identifier = 'PHYSLAB01')),
('6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d', 'incharge.ph@university.edu', 'Lab Incharge', 'Prof. Pat Incharge', (SELECT id FROM labs WHERE lab_identifier = 'PHYSLAB01')),
('7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', 'assistant.ch@university.edu', 'Lab Assistant', 'Taylor Assistant', (SELECT id FROM labs WHERE lab_identifier = 'CHEMLAB01')),
('8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f', 'incharge.ch@university.edu', 'Lab Incharge', 'Dr. Jordan Incharge', (SELECT id FROM labs WHERE lab_identifier = 'CHEMLAB01'));

-- Insert sample assets (using asset_types by identifier via subselect)
INSERT INTO assets (date, name_of_supply, asset_type, invoice_number, description, rate, is_consumable, allocated_lab, created_by, approved, approved_by, approved_by_lab_incharge) VALUES
('2024-01-15', 'Dell OptiPlex 7090', (SELECT id FROM asset_types WHERE identifier = 'PC' LIMIT 1), 'INV-2024-001', 'Desktop Computer Intel i7, 16GB RAM, 512GB SSD', 75000.00, false, (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams')),

('2024-01-20', 'HP LaserJet Pro M404dn', (SELECT id FROM asset_types WHERE identifier = 'PR' LIMIT 1), 'INV-2024-002', 'Laser Printer Monochrome', 25000.00, false, (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams')),

('2024-01-25', 'Cisco Catalyst 2960-X', (SELECT id FROM asset_types WHERE identifier = 'NW' LIMIT 1), 'INV-2024-003', 'Network Switch 48-port', 45000.00, false, (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams')),

('2024-02-01', 'Logitech C920 HD Pro', (SELECT id FROM asset_types WHERE identifier = 'PE' LIMIT 1), 'INV-2024-004', 'Webcam Full HD 1080p', 8000.00, false, (SELECT id FROM labs WHERE lab_identifier = 'MELAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller')),

('2024-02-10', 'Arduino Uno R3', (SELECT id FROM asset_types WHERE identifier = 'MC' LIMIT 1), 'INV-2024-005', 'Microcontroller Board', 1500.00, false, (SELECT id FROM labs WHERE lab_identifier = 'MELAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller')),

('2024-02-15', 'Lab Consumables Kit', (SELECT id FROM asset_types WHERE identifier = 'OT' LIMIT 1), 'INV-2024-006', 'Various lab consumables including cables, connectors, and components', 5000.00, true, (SELECT id FROM labs WHERE lab_identifier = 'ELECLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams')),

('2024-02-20', 'Chemical Reagents Set', (SELECT id FROM asset_types WHERE identifier = 'OT' LIMIT 1), 'INV-2024-007', 'Basic chemical reagents for experiments', 12000.00, true, (SELECT id FROM labs WHERE lab_identifier = 'CHEMLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'));

-- After assets inserted, asset_id triggers will have set asset_id values

-- Insert sample asset issues
INSERT INTO asset_issues (asset_id, issue_description, reported_by, status) VALUES
((SELECT id FROM assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1), 
 'Computer not booting, showing blue screen error', 
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 'open'),

((SELECT id FROM assets WHERE name_of_supply = 'HP LaserJet Pro M404dn' LIMIT 1),
 'Printer showing paper jam error, no paper found',
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 'resolved'),

((SELECT id FROM assets WHERE name_of_supply = 'Cisco Catalyst 2960-X' LIMIT 1),
 'Network connectivity issues, ports not responding',
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 'open');

-- Insert sample asset transfers
INSERT INTO asset_transfers (asset_id, from_lab, to_lab, initiated_by, status) VALUES
((SELECT id FROM assets WHERE name_of_supply = 'Logitech C920 HD Pro' LIMIT 1),
 (SELECT id FROM labs WHERE lab_identifier = 'MELAB01'),
 (SELECT id FROM labs WHERE lab_identifier = 'CSLAB01'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'), 'pending');

-- Manual log entries for system events (map to user_profiles.id)
INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name, severity_level, success, created_at) VALUES
((SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-15 09:00:00'),
((SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-15 09:15:00'),
((SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-16 09:00:00'),
((SELECT id FROM user_profiles WHERE name = 'Bob Davis'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-17 08:45:00'),
((SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-17 09:30:00'),
((SELECT id FROM user_profiles WHERE name = 'Mike Wilson'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-18 08:30:00'),
((SELECT id FROM user_profiles WHERE name = 'Dr. Lisa Brown'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-18 09:00:00'),
((SELECT id FROM user_profiles WHERE name = 'David Lee'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-19 08:45:00'),
((SELECT id FROM user_profiles WHERE name = 'Prof. Anna Garcia'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-19 09:15:00'),
((SELECT id FROM user_profiles WHERE name = 'James Taylor'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-20 08:30:00'),
((SELECT id FROM user_profiles WHERE name = 'Dr. Maria Rodriguez'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-20 09:00:00');

-- Manual notification entries (map to user_profiles.id)
INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message, is_read, created_at) VALUES
((SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'),
 'created', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1),
 'Dell OptiPlex 7090', 'New asset created: Dell OptiPlex 7090', false, '2024-01-15 10:30:00'),

((SELECT id FROM user_profiles WHERE name = 'Alice Johnson'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'),
 'approved', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1),
 'Dell OptiPlex 7090', 'Asset approved: Dell OptiPlex 7090', false, '2024-01-15 11:00:00'),

((SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'),
 (SELECT id FROM user_profiles WHERE name = 'Prof. Robert Williams'),
 'created', 'issue',
 (SELECT id FROM asset_issues WHERE issue_description LIKE '%Computer not booting%' LIMIT 1),
 'Issue #', 'New issue reported: Computer not booting', false, '2024-01-16 09:15:00'),

((SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'),
 'created', 'transfer',
 (SELECT id FROM asset_transfers WHERE from_lab = (SELECT id FROM labs WHERE lab_identifier = 'MELAB01') LIMIT 1),
 'Asset Transfer', 'Asset transfer initiated: Logitech C920 HD Pro', false, '2024-01-17 14:20:00'),

((SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'),
 (SELECT id FROM user_profiles WHERE name = 'Dr. Sarah Miller'),
 'login', 'system',
 NULL,
 'System', 'User logged in successfully', false, '2024-01-17 09:30:00'),

((SELECT id FROM user_profiles WHERE name = 'Mike Wilson'),
 (SELECT id FROM user_profiles WHERE name = 'Mike Wilson'),
 'created', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Lab Consumables Kit' LIMIT 1),
 'Lab Consumables Kit', 'New asset created: Lab Consumables Kit', false, '2024-02-15 10:00:00'),

((SELECT id FROM user_profiles WHERE name = 'Dr. Lisa Brown'),
 (SELECT id FROM user_profiles WHERE name = 'Mike Wilson'),
 'approved', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Lab Consumables Kit' LIMIT 1),
 'Lab Consumables Kit', 'Asset approved: Lab Consumables Kit', false, '2024-02-15 11:30:00'),

((SELECT id FROM user_profiles WHERE name = 'David Lee'),
 (SELECT id FROM user_profiles WHERE name = 'David Lee'),
 'created', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Arduino Uno R3' LIMIT 1),
 'Arduino Uno R3', 'New asset created: Arduino Uno R3', false, '2024-02-10 09:45:00'),

((SELECT id FROM user_profiles WHERE name = 'Prof. Anna Garcia'),
 (SELECT id FROM user_profiles WHERE name = 'David Lee'),
 'approved', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Arduino Uno R3' LIMIT 1),
 'Arduino Uno R3', 'Asset approved: Arduino Uno R3', false, '2024-02-10 10:15:00'),

((SELECT id FROM user_profiles WHERE name = 'James Taylor'),
 (SELECT id FROM user_profiles WHERE name = 'James Taylor'),
 'created', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Chemical Reagents Set' LIMIT 1),
 'Chemical Reagents Set', 'New asset created: Chemical Reagents Set', false, '2024-02-20 14:00:00'),

((SELECT id FROM user_profiles WHERE name = 'Dr. Maria Rodriguez'),
 (SELECT id FROM user_profiles WHERE name = 'James Taylor'),
 'approved', 'asset',
 (SELECT id FROM assets WHERE name_of_supply = 'Chemical Reagents Set' LIMIT 1),
 'Chemical Reagents Set', 'Asset approved: Chemical Reagents Set', false, '2024-02-20 15:30:00');

-- Insert sample deleted assets (asset_type references asset_types.id)
INSERT INTO deleted_assets (
  original_asset_id, sr_no, date, name_of_supply, asset_type, invoice_number,
  description, rate, asset_id, remark, is_consumable, allocated_lab, created_by,
  approved, approved_by, approved_at, approved_by_lab_incharge, approved_at_lab_incharge,
  deleted_by, deleted_at, hod_approval, hod_approved_by, hod_approved_at,
  restored, restored_at, restored_by, created_at, updated_at
) VALUES
(
  (SELECT id FROM public.assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1),
  1, '2024-04-01', 'Dell OptiPlex 7090',
  (SELECT id FROM asset_types WHERE identifier = 'PC' LIMIT 1),
  'INV-2024-001', 'Desktop Computer Intel i7, 16GB RAM, 512GB SSD',
  75000.00, 'RSCOE/CSBS/CSLAB01/PC-1', 'Obsolete model', false,
  (SELECT id FROM public.labs WHERE lab_identifier = 'CSLAB01'),
  (SELECT id FROM public.user_profiles WHERE name = 'Alice Johnson'),
  true, (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-01 10:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Prof. Robert Williams'),
  '2024-04-01 11:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-02 09:00:00', false, NULL, NULL, false, NULL, NULL,
  '2024-04-01 08:00:00', '2024-04-01 08:00:00'
),
(
  (SELECT id FROM public.assets WHERE name_of_supply = 'HP LaserJet Pro M404dn' LIMIT 1),
  2, '2024-04-03', 'HP LaserJet Pro M404dn',
  (SELECT id FROM asset_types WHERE identifier = 'PR' LIMIT 1),
  'INV-2024-002', 'Laser Printer Monochrome',
  25000.00, 'RSCOE/CSBS/CSLAB01/PR-1', 'Broken printer', false,
  (SELECT id FROM public.labs WHERE lab_identifier = 'CSLAB01'),
  (SELECT id FROM public.user_profiles WHERE name = 'Alice Johnson'),
  true, (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-03 10:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Prof. Robert Williams'),
  '2024-04-03 11:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-04 09:00:00', false, NULL, NULL, false, NULL, NULL,
  '2024-04-03 08:00:00', '2024-04-03 08:00:00'
),
(
  (SELECT id FROM public.assets WHERE name_of_supply = 'Cisco Catalyst 2960-X' LIMIT 1),
  3, '2024-04-05', 'Cisco Catalyst 2960-X',
  (SELECT id FROM asset_types WHERE identifier = 'NW' LIMIT 1),
  'INV-2024-003', 'Network Switch 48-port',
  45000.00, 'RSCOE/CSBS/CSLAB01/NW-1', 'Outdated firmware', false,
  (SELECT id FROM public.labs WHERE lab_identifier = 'CSLAB01'),
  (SELECT id FROM public.user_profiles WHERE name = 'Alice Johnson'),
  true, (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-05 10:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Prof. Robert Williams'),
  '2024-04-05 11:00:00',
  (SELECT id FROM public.user_profiles WHERE name = 'Dr. John Smith'),
  '2024-04-06 09:00:00', false, NULL, NULL, false, NULL, NULL,
  '2024-04-05 08:00:00', '2024-04-05 08:00:00'
);

-- ===================================================================
-- END OF SCHEMA
-- ===================================================================