-- Create users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('lab_assistant', 'assistant professor', 'hod')) NOT NULL,
  password TEXT NOT NULL
);

-- Create inventory table
CREATE TABLE inventory (
  item_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  invoice_no TEXT,
  description TEXT,
  lab TEXT,
  issue VARCHAR(50),
  current_status VARCHAR(50),
  photo_url VARCHAR(50)
);

-- Create repair table
CREATE TABLE repair (
  repair_id UUID PRIMARY KEY,
  sent_date TIMESTAMP,
  return_date TIMESTAMP,
  repair_status VARCHAR,
  received_remarks VARCHAR
);

-- Create logs table
CREATE TABLE logs (
  logs_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  action TEXT,
  table_name TEXT,
  timestamp TIMESTAMP
);
