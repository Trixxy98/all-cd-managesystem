-- Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import sessions table
CREATE TABLE import_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    region VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main data table based on your Excel structure
CREATE TABLE network_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES import_sessions(id),
    sheet_name VARCHAR(50) NOT NULL,
    node VARCHAR(255),
    ne_ip VARCHAR(50),
    idu VARCHAR(500),
    capacity VARCHAR(100),
    location VARCHAR(500),
    parallel VARCHAR(100),
    main_stby VARCHAR(50),
    site_id_a VARCHAR(50),
    lrd_a VARCHAR(50),
    site_id_b VARCHAR(50),
    lrd_b VARCHAR(50),
    uplink VARCHAR(50),
    link_count VARCHAR(50),
    protection VARCHAR(100),
    remote_ip VARCHAR(50),
    remote_slot VARCHAR(100),
    l3_port VARCHAR(100),
    ras VARCHAR(100),
    hostname VARCHAR(255),
    link VARCHAR(500),
    qam VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_network_data_session_id ON network_data(session_id);
CREATE INDEX idx_network_data_sheet_name ON network_data(sheet_name);
CREATE INDEX idx_network_data_node ON network_data(node);
CREATE INDEX idx_network_data_idu ON network_data(idu);
CREATE INDEX idx_network_data_capacity ON network_data(capacity);

-- Insert demo users (we'll use simple passwords for now)
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@company.com', 'System Administrator', 'admin123', 'admin'),
('user@company.com', 'Test User', 'user123', 'user');

-- Verify tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';