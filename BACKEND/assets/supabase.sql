-- Enhanced Database Schema for Asset Management System
-- This file contains the updated schema with all missing fields

-- Drop existing tables if they exist (for migration purposes)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS repair CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS maintenance CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('lab_assistant', 'assistant professor', 'hod', 'admin')) NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced inventory table with all required fields
CREATE TABLE inventory (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lab TEXT,
  issue VARCHAR(50),
  current_status VARCHAR(50) CHECK (current_status IN ('active', 'maintenance', 'retired', 'disposed', 'damaged')),
  category VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  asset_tag VARCHAR(50) UNIQUE,
  barcode VARCHAR(100),
  qr_code VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(10, 2),
  purchase_order VARCHAR(50),
  vendor VARCHAR(100),
  condition_status VARCHAR(50) CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  warranty_expiry DATE,
  warranty_provider VARCHAR(100),
  building VARCHAR(100),
  department VARCHAR(100),
  room VARCHAR(50),
  floor VARCHAR(20),
  custodian VARCHAR(100),
  assigned_to VARCHAR(100),
  specifications JSONB,
  photos JSONB,
  documents JSONB,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- Create maintenance table
CREATE TABLE maintenance (
  maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory(item_id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('preventive', 'corrective', 'predictive', 'emergency')),
  title VARCHAR(200),
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  due_date DATE,
  status VARCHAR(50) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  cost DECIMAL(10, 2),
  performed_by VARCHAR(100),
  vendor VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transfer table
CREATE TABLE transfers (
  transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory(item_id) ON DELETE CASCADE,
  from_department VARCHAR(100),
  to_department VARCHAR(100),
  from_building VARCHAR(100),
  to_building VARCHAR(100),
  from_room VARCHAR(50),
  to_room VARCHAR(50),
  from_custodian VARCHAR(100),
  to_custodian VARCHAR(100),
  from_assigned_to VARCHAR(100),
  to_assigned_to VARCHAR(100),
  transfer_date DATE,
  transfer_reason TEXT,
  approved_by VARCHAR(100),
  transfer_method VARCHAR(50),
  condition_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repair table
CREATE TABLE repair (
  repair_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory(item_id) ON DELETE CASCADE,
  sent_date TIMESTAMP,
  return_date TIMESTAMP,
  repair_status VARCHAR(50) CHECK (repair_status IN ('sent', 'in_progress', 'completed', 'returned', 'cancelled')),
  repair_description TEXT,
  received_remarks VARCHAR(500),
  cost DECIMAL(10, 2),
  vendor VARCHAR(100),
  technician VARCHAR(100),
  warranty_claim BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create logs table for audit trail
CREATE TABLE logs (
  logs_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_status ON inventory(current_status);
CREATE INDEX idx_inventory_department ON inventory(department);
CREATE INDEX idx_inventory_room ON inventory(room);
CREATE INDEX idx_inventory_custodian ON inventory(custodian);
CREATE INDEX idx_inventory_asset_tag ON inventory(asset_tag);
CREATE INDEX idx_inventory_serial_number ON inventory(serial_number);
CREATE INDEX idx_maintenance_item_id ON maintenance(item_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_maintenance_due_date ON maintenance(due_date);
CREATE INDEX idx_transfers_item_id ON transfers(item_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_repair_item_id ON repair(item_id);
CREATE INDEX idx_repair_status ON repair(repair_status);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Insert sample data for testing
INSERT INTO users (user_id, name, email, role, password) VALUES
  (gen_random_uuid(), 'Admin User', 'admin@example.com', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  (gen_random_uuid(), 'Lab Assistant', 'assistant@example.com', 'lab_assistant', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample inventory items
INSERT INTO inventory (item_id, name, description, lab, current_status, category, make, model, serial_number, asset_tag, building, department, room, custodian, purchase_date, purchase_cost, condition_status, warranty_expiry) VALUES
  (gen_random_uuid(), 'Dell Laptop', 'Dell Latitude 5520', 'Computer Lab', 'active', 'IT Equipment', 'Dell', 'Latitude 5520', 'DL5520-001', 'EDU-LAP-001', 'Main Building', 'IT Department', 'Lab-101', 'John Doe', '2023-01-15', 1200.00, 'excellent', '2026-01-15'),
  (gen_random_uuid(), 'HP Printer', 'HP LaserJet Pro M404dn', 'Admin Office', 'active', 'Office Equipment', 'HP', 'LaserJet Pro M404dn', 'HP404-001', 'EDU-PRN-001', 'Admin Building', 'Admin Department', 'Office-201', 'Jane Smith', '2023-02-20', 350.00, 'good', '2025-02-20');
