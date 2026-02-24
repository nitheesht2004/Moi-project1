-- Seed default user (password: admin123)
INSERT INTO users (username, password, role) VALUES
('family', '$2a$10$XQZ9Z9Z9Z9Z9Z9Z9Z9Z9ZeHashedPasswordHere', 'family');

-- Seed locations
INSERT INTO locations (name) VALUES
('Home'),
('Office'),
('Store');
