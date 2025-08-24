-- ===================================================================
-- SCHEMA RESET
-- ===================================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ===================================================================
-- CUSTOM ENUM TYPES
-- ===================================================================
CREATE TYPE user_role AS ENUM ('HOD', 'Lab Assistant', 'Faculty');
CREATE TYPE issue_status AS ENUM ('open', 'resolved');
CREATE TYPE transfer_status AS ENUM ('pending', 'received');

-- ===================================================================
-- TABLES
-- ===================================================================

-- User profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL,
  name text NOT NULL,
  lab_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assets table
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no serial UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  name_of_supply text NOT NULL,
  asset_type text NOT NULL DEFAULT 'other',
  invoice_number text,
  description text,
  quantity integer NOT NULL CHECK (quantity > 0),
  rate numeric(10,2) NOT NULL CHECK (rate >= 0),
  total_amount numeric(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  remark text,
  allocated_lab text NOT NULL,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Asset issues table
CREATE TABLE asset_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  issue_description text NOT NULL,
  reported_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reported_at timestamptz DEFAULT now(),
  status issue_status DEFAULT 'open',
  resolved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Asset transfers table
CREATE TABLE asset_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  from_lab text NOT NULL,
  to_lab text NOT NULL,
  initiated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  initiated_at timestamptz DEFAULT now(),
  received_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  received_at timestamptz,
  status transfer_status DEFAULT 'pending',
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  message text,
  is_read boolean DEFAULT FALSE,
  created_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile with elevated privileges
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_id uuid,
  p_email text,
  p_role text,  -- Changed from user_role to text to accept string input
  p_name text,
  p_lab_id text
) RETURNS uuid AS $$
DECLARE
  v_profile_id uuid;
  v_valid_role user_role;
BEGIN
  -- Validate and convert the role string to the enum type
  BEGIN
    v_valid_role := p_role::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    -- If the role is invalid, default to 'Lab Assistant'
    v_valid_role := 'Lab Assistant';
  END;
  
  -- Insert the user profile with elevated privileges
  INSERT INTO user_profiles (auth_id, email, role, name, lab_id)
  VALUES (p_auth_id, p_email, v_valid_role, p_name, p_lab_id)
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_profile(uuid, text, text, text, text) TO authenticated, anon;

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  action_type text,
  entity_id uuid,
  entity_name text,
  entity_type text,
  actor_id uuid,
  target_auth_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text;
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

  IF target_auth_id IS NOT NULL THEN
    -- Create notification for specific user
    INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message)
    VALUES (target_auth_id, actor_id, action_type, entity_type, entity_id, entity_name, v_message);
  ELSE
    -- Broadcast to all users in user_profiles
    INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message)
    SELECT auth_id, actor_id, action_type, entity_type, entity_id, entity_name, v_message
    FROM user_profiles;
  END IF;
END;
$$;

-- Optional permissions (Supabase/PostgREST typical setup)
GRANT EXECUTE ON FUNCTION public.create_notification(text, uuid, text, text, uuid, uuid) TO authenticated, anon;

-- -------------------------------------------------------------------
-- log_activity(...)  -> calls create_notification with the CORRECT order
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid,
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
BEGIN
  -- Insert the activity log
  INSERT INTO activity_logs (
    user_id, action_type, entity_type, entity_id, entity_name,
    old_values, new_values, changes, severity_level, success, error_message, metadata
  )
  VALUES (
    p_user_id, p_action_type, p_entity_type, p_entity_id, p_entity_name,
    p_old_values, p_new_values, p_changes, p_severity_level, p_success, p_error_message, p_metadata
  )
  RETURNING id INTO v_log_id;

  -- IMPORTANT: Correct argument order for create_notification
  PERFORM public.create_notification(
    p_action_type,   -- action_type (text)
    p_entity_id,     -- entity_id   (uuid)
    p_entity_name,   -- entity_name (text)
    p_entity_type,   -- entity_type (text)
    p_user_id        -- actor_id    (uuid)
  );

  RETURN v_log_id;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to log activity: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(
  uuid, text, text, uuid, text, jsonb, jsonb, jsonb, text, boolean, text, jsonb
) TO authenticated, anon;

-- -------------------------------------------------------------------
-- (Unchanged) JSONB diff helper, included for completeness
-- -------------------------------------------------------------------
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

-- Trigger function for user_profiles table
CREATE OR REPLACE FUNCTION trg_user_profiles_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
BEGIN
  -- Get actor ID from current session
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_id,
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
    -- Log update
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    PERFORM log_activity(
      v_actor_id,
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
    -- Log deletion
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_id,
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
  v_actor_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
BEGIN
  -- Get actor ID from current session
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_id,
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
    -- Log update
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    -- Check if this is an approval action
    IF OLD.approved = false AND NEW.approved = true THEN
      PERFORM log_activity(
        v_actor_id,
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
        v_actor_id,
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
    -- Log deletion
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_id,
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

-- Trigger function for asset_issues table
CREATE OR REPLACE FUNCTION trg_asset_issues_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
BEGIN
  -- Get actor ID from current session
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_id,
      'report',
      'issue',
      NEW.id,
      'Issue #' || NEW.id::text,
      NULL,
      v_new_data,
      NULL,
      'warning',
      true
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log update
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    -- Check if this is a resolution action
    IF OLD.status = 'open' AND NEW.status = 'resolved' THEN
      PERFORM log_activity(
        v_actor_id,
        'resolve',
        'issue',
        NEW.id,
        'Issue #' || NEW.id::text,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    ELSE
      PERFORM log_activity(
        v_actor_id,
        'update',
        'issue',
        NEW.id,
        'Issue #' || NEW.id::text,
        v_old_data,
        v_new_data,
        v_changes,
        'info',
        true
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Log deletion
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_id,
      'delete',
      'issue',
      OLD.id,
      'Issue #' || OLD.id::text,
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

-- Trigger function for asset_transfers table
CREATE OR REPLACE FUNCTION trg_asset_transfers_audit() RETURNS TRIGGER AS $$
DECLARE
  v_actor_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changes jsonb;
  v_asset_name text;
BEGIN
  -- Get actor ID from current session
  v_actor_id := auth.uid();
  
  -- Get asset name
  SELECT name_of_supply INTO v_asset_name FROM assets WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);
  
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    v_new_data := to_jsonb(NEW);
    PERFORM log_activity(
      v_actor_id,
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
    -- Log update
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changes := get_jsonb_diff(v_old_data, v_new_data);
    
    -- Check if this is a receive action
    IF OLD.status = 'pending' AND NEW.status = 'received' THEN
      PERFORM log_activity(
        v_actor_id,
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
        v_actor_id,
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
    -- Log deletion
    v_old_data := to_jsonb(OLD);
    PERFORM log_activity(
      v_actor_id,
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

-- Create triggers for all tables
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

-- ===================================================================
-- RLS POLICIES
-- ===================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles: Users can only see their own profile
CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY user_profiles_insert_admin ON user_profiles
  FOR INSERT WITH CHECK (true); -- System-level inserts only
CREATE POLICY user_profiles_insert_system ON user_profiles
  FOR INSERT WITH CHECK (true); -- Allow all inserts for system functions

-- assets: All users can see all assets
CREATE POLICY assets_all ON assets
  FOR ALL USING (true) WITH CHECK (true);

-- asset_issues: All users can see all issues
CREATE POLICY issues_all ON asset_issues
  FOR ALL USING (true) WITH CHECK (true);

-- asset_transfers: All users can see all transfers
CREATE POLICY transfers_all ON asset_transfers
  FOR ALL USING (true) WITH CHECK (true);

-- notifications: All users can see all notifications
CREATE POLICY notifications_all ON notifications
  FOR ALL USING (true);

-- activity_logs: All users can see all logs
CREATE POLICY logs_all ON activity_logs
  FOR ALL USING (true);

-- ===================================================================
-- GRANTS
-- ===================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ===================================================================
-- SAMPLE DATA 
-- ===================================================================
-- Note: Replace auth_id values with actual UUIDs from your Supabase auth.users table

-- Insert sample user profiles
INSERT INTO user_profiles (auth_id, email, role, name, lab_id) VALUES
('734ed3f0-37a9-49d0-8388-ed24536ee246', 'hod@university.edu', 'HOD', 'Dr. John Smith', 'ADMIN'),
('7c8785c1-8743-4618-86ea-3922554a5b87', 'labassistant@university.edu', 'Lab Assistant', 'Alice Johnson', 'CSE-LAB-01'),
('3f732856-c91e-442c-8abf-5c529906f9d7', 'faculty@university.edu', 'Faculty', 'Prof. Robert Williams', 'CSE-LAB-01'),
('2be9de39-516d-4c50-a7a4-c13c7e2fe6a6', 'labassistant2@university.edu', 'Lab Assistant', 'Bob Davis', 'MECH-LAB-01'),
('61592b47-e1c0-49ce-a5e5-0fc7d7eed86a', 'faculty2@university.edu', 'Faculty', 'Dr. Sarah Miller', 'MECH-LAB-01');

-- Insert sample assets (this will trigger logs and notifications)
INSERT INTO assets (date, name_of_supply, asset_type, invoice_number, description, quantity, rate, allocated_lab, created_by, approved, approved_by) VALUES
('2024-01-15', 'Dell OptiPlex 7090', 'cpu', 'INV-2024-001', 'Desktop Computer Intel i7, 16GB RAM, 512GB SSD', 10, 75000.00, 'CSE-LAB-01', 
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true, 
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith')),

('2024-01-20', 'HP LaserJet Pro M404dn', 'printer', 'INV-2024-002', 'Laser Printer Monochrome', 3, 25000.00, 'CSE-LAB-01',
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith')),

('2024-01-25', 'Cisco Catalyst 2960-X', 'network', 'INV-2024-003', 'Network Switch 48-port', 2, 45000.00, 'CSE-LAB-01',
 (SELECT id FROM user_profiles WHERE name = 'Alice Johnson'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith')),

('2024-02-01', 'Logitech C920 HD Pro', 'peripheral', 'INV-2024-004', 'Webcam Full HD 1080p', 15, 8000.00, 'MECH-LAB-01',
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith')),

('2024-02-10', 'Arduino Uno R3', 'microcontroller', 'INV-2024-005', 'Microcontroller Board', 50, 1500.00, 'MECH-LAB-01',
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), true,
 (SELECT id FROM user_profiles WHERE name = 'Dr. John Smith'));

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
 'MECH-LAB-01', 'CSE-LAB-01',
 (SELECT id FROM user_profiles WHERE name = 'Bob Davis'), 'pending');

-- Manual log entries for system events
INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name, severity_level, success, created_at) VALUES
((SELECT auth_id FROM user_profiles WHERE name = 'Alice Johnson'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-15 09:00:00'),
((SELECT auth_id FROM user_profiles WHERE name = 'Dr. John Smith'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-15 09:15:00'),
((SELECT auth_id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-16 09:00:00'),
((SELECT auth_id FROM user_profiles WHERE name = 'Bob Davis'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-17 08:45:00'),
((SELECT auth_id FROM user_profiles WHERE name = 'Dr. Sarah Miller'), 'login', 'system', NULL, 'User Login', 'info', true, '2024-01-17 09:30:00');

-- Manual notification entries
INSERT INTO notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_name, message, is_read, created_at) VALUES
((SELECT auth_id FROM user_profiles WHERE name = 'Dr. John Smith'), 
 (SELECT auth_id FROM user_profiles WHERE name = 'Alice Johnson'),
 'created', 'asset', 
 (SELECT id FROM assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1),
 'Dell OptiPlex 7090', 'New asset created: Dell OptiPlex 7090', false, '2024-01-15 10:30:00'),

((SELECT auth_id FROM user_profiles WHERE name = 'Alice Johnson'), 
 (SELECT auth_id FROM user_profiles WHERE name = 'Dr. John Smith'),
 'approved', 'asset', 
 (SELECT id FROM assets WHERE name_of_supply = 'Dell OptiPlex 7090' LIMIT 1),
 'Dell OptiPlex 7090', 'Asset approved: Dell OptiPlex 7090', false, '2024-01-15 11:00:00'),

((SELECT auth_id FROM user_profiles WHERE name = 'Prof. Robert Williams'), 
 (SELECT auth_id FROM user_profiles WHERE name = 'Prof. Robert Williams'),
 'created', 'issue', 
 (SELECT id FROM asset_issues WHERE issue_description LIKE '%Computer not booting%' LIMIT 1),
 'Issue #', 'New issue reported: Computer not booting', false, '2024-01-16 09:15:00'),

((SELECT auth_id FROM user_profiles WHERE name = 'Bob Davis'), 
 (SELECT auth_id FROM user_profiles WHERE name = 'Bob Davis'),
 'created', 'transfer', 
 (SELECT id FROM asset_transfers WHERE from_lab = 'MECH-LAB-01' LIMIT 1),
 'Asset Transfer', 'Asset transfer initiated: Logitech C920 HD Pro', false, '2024-01-17 14:20:00'),

((SELECT auth_id FROM user_profiles WHERE name = 'Dr. Sarah Miller'), 
 (SELECT auth_id FROM user_profiles WHERE name = 'Dr. Sarah Miller'),
 'login', 'system', 
 NULL,
 'System', 'User logged in successfully', false, '2024-01-17 09:30:00');