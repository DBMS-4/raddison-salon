-- =====================================================
-- Raddison Salon Management System - Database Schema
-- =====================================================
-- Version: 1.0
-- Description: Complete database initialization script
-- Tables: Staff, Customers, Services, Appointments, Messages, Admins
-- =====================================================

CREATE DATABASE IF NOT EXISTS raddison_salon;
USE raddison_salon;

DROP TABLE IF EXISTS Appointments;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Services;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Admins;


CREATE TABLE Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE,
    hire_date date,
    salary DECIMAL(10,2)
);

CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100)
);

CREATE TABLE Services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    is_premium TINYINT(1) DEFAULT 0
);


CREATE TABLE Appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    staff_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
);

CREATE TABLE Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject varchar(150) Default Null,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO Staff (full_name, role, phone, email, hire_date, salary) VALUES
('Emma Johnson', 'Hair Stylist', '555-0101', 'emma.j@raddison.com', '2023-01-15', 45000.00),
('Michael Chen', 'Barber', '555-0102', 'michael.c@raddison.com', '2023-03-20', 42000.00),
('Sofia Rodriguez', 'Aesthetician', '555-0103', 'sofia.r@raddison.com', '2023-05-10', 48000.00),
('James Wilson', 'Massage Therapist', '555-0104', 'james.w@raddison.com', '2023-06-01', 50000.00),
('Olivia Brown', 'Nail Technician', '555-0105', 'olivia.b@raddison.com', '2023-07-22', 40000.00);


INSERT INTO Customers (full_name, phone, email) VALUES
('Sarah Thompson', '555-1001', 'sarah.t@email.com'),
('David Martinez', '555-1002', 'david.m@email.com'),
('Rachel Green', '555-1003', 'rachel.g@email.com'),
('Alex Parker', '555-1004', 'alex.p@email.com'),
('Jessica Lee', '555-1005', 'jessica.l@email.com');

INSERT INTO Services (service_name, description, price, duration_minutes, is_premium) VALUES
('Classic Haircut', 'Professional haircut with styling', 800.00, 45, 0),
('Women\'s Haircut', 'Haircut with wash and blow dry', 1200.00, 60, 0),
('Hair Coloring', 'Full hair coloring service', 4000.00, 120, 0),
('Highlights', 'Partial or full highlights', 2500.00, 150, 0),
('Blow Dry & Style', 'Professional blow dry and styling', 1200.00, 30, 0),
('Basic Facial', 'Deep cleansing facial treatment', 1200.00, 60, 0),
('Anti-Aging Facial', 'Advanced anti-aging treatment', 1500.00, 75, 0),
('Acne Treatment', 'Specialized acne care facial', 900.00, 60, 0),
('Beard Trim', 'Professional beard shaping and trim', 400.00, 30, 0),
('Hot Towel Shave', 'Traditional hot towel straight razor shave', 300.00, 45, 0),
('Manicure', 'Complete nail care for hands', 1000.00, 45, 0),
('Pedicure', 'Complete nail care for feet', 1000.00, 60, 0);

INSERT INTO Services (service_name, description, price, duration_minutes, is_premium) VALUES
('Luxury Spa Package', 'Complete spa experience with massage, facial, and body treatment', 3500.00, 180, 1),
('Gold Facial Treatment', 'Premium facial with 24k gold infusion for ultimate rejuvenation', 1800.00, 90, 1),
('Diamond Glow Treatment', 'Advanced exfoliation and infusion treatment for radiant skin', 3000.00, 75, 1),
('Platinum Hair Treatment', 'Intensive hair restoration and keratin treatment', 3500.00, 120, 1),
('VIP Bridal Package', 'Complete bridal preparation including hair, makeup, and skincare', 7000.00, 240, 1),
('Executive Grooming Suite', 'Premium grooming experience for professionals', 1500.00, 90, 1);

INSERT INTO Appointments (customer_id, service_id, staff_id, appointment_date, appointment_time, status, notes) VALUES
(1, 2, 1, '2024-11-15', '10:00:00', 'Scheduled', 'Customer prefers layered cut'),
(2, 1, 2, '2024-11-15', '14:00:00', 'Scheduled', NULL),
(3, 6, 3, '2024-11-16', '11:00:00', 'Scheduled', 'First time customer, sensitive skin'),
(4, 11, 5, '2024-11-16', '15:30:00', 'Scheduled', NULL),
(5, 13, 1, '2024-11-17', '09:00:00', 'Scheduled', 'Anniversary special - wants luxury experience');

INSERT INTO Admins (username, password_hash) VALUES
('admin', '$2b$10$jerPWO5ZLWQ2lSmt5Cc4ee0lgfrEpGwQjyDjDDzEc4wBj9MT1UUQy');

-- =====================================================
-- TRIGGERS SECTION
-- =====================================================
-- Purpose: Automate audit logging, data validation, 
-- timestamp management, and business rule enforcement
-- =====================================================

-- -----------------------------------------------------
-- 1. AUDIT TABLES
-- -----------------------------------------------------
-- Create audit tables to track changes to critical data

CREATE TABLE IF NOT EXISTS Staff_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_full_name VARCHAR(100),
    new_full_name VARCHAR(100),
    old_role VARCHAR(50),
    new_role VARCHAR(50),
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Services_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_service_name VARCHAR(100),
    new_service_name VARCHAR(100),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    old_is_premium TINYINT(1),
    new_is_premium TINYINT(1),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Appointments_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    old_staff_id INT,
    new_staff_id INT,
    old_appointment_date DATE,
    new_appointment_date DATE,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 2. STAFF TRIGGERS
-- -----------------------------------------------------

-- Trigger: Validate staff data before insert
DELIMITER $$
CREATE TRIGGER trg_staff_before_insert
BEFORE INSERT ON Staff
FOR EACH ROW
BEGIN
    -- Validate salary is non-negative
    IF NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary cannot be negative';
    END IF;
    
    -- Ensure hire_date is not in the future
    IF NEW.hire_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hire date cannot be in the future';
    END IF;
    
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit staff insertions
DELIMITER $$
CREATE TRIGGER trg_staff_after_insert
AFTER INSERT ON Staff
FOR EACH ROW
BEGIN
    INSERT INTO Staff_Audit (staff_id, action_type, new_full_name, new_role, new_salary, changed_by)
    VALUES (NEW.staff_id, 'INSERT', NEW.full_name, NEW.role, NEW.salary, USER());
END$$
DELIMITER ;

-- Trigger: Validate staff data before update
DELIMITER $$
CREATE TRIGGER trg_staff_before_update
BEFORE UPDATE ON Staff
FOR EACH ROW
BEGIN
    -- Validate salary is non-negative
    IF NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary cannot be negative';
    END IF;
    
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit staff updates
DELIMITER $$
CREATE TRIGGER trg_staff_after_update
AFTER UPDATE ON Staff
FOR EACH ROW
BEGIN
    INSERT INTO Staff_Audit (
        staff_id, action_type, 
        old_full_name, new_full_name,
        old_role, new_role,
        old_salary, new_salary,
        changed_by
    )
    VALUES (
        NEW.staff_id, 'UPDATE',
        OLD.full_name, NEW.full_name,
        OLD.role, NEW.role,
        OLD.salary, NEW.salary,
        USER()
    );
END$$
DELIMITER ;

-- Trigger: Audit staff deletions
DELIMITER $$
CREATE TRIGGER trg_staff_after_delete
AFTER DELETE ON Staff
FOR EACH ROW
BEGIN
    INSERT INTO Staff_Audit (staff_id, action_type, old_full_name, old_role, old_salary, changed_by)
    VALUES (OLD.staff_id, 'DELETE', OLD.full_name, OLD.role, OLD.salary, USER());
END$$
DELIMITER ;

-- -----------------------------------------------------
-- 3. SERVICES TRIGGERS
-- -----------------------------------------------------

-- Trigger: Validate service data before insert
DELIMITER $$
CREATE TRIGGER trg_services_before_insert
BEFORE INSERT ON Services
FOR EACH ROW
BEGIN
    -- Validate price is positive
    IF NEW.price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service price must be greater than 0';
    END IF;
    
    -- Validate duration is positive
    IF NEW.duration_minutes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service duration must be greater than 0 minutes';
    END IF;
    
    -- Ensure is_premium defaults to 0 if NULL
    IF NEW.is_premium IS NULL THEN
        SET NEW.is_premium = 0;
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit service insertions
DELIMITER $$
CREATE TRIGGER trg_services_after_insert
AFTER INSERT ON Services
FOR EACH ROW
BEGIN
    INSERT INTO Services_Audit (
        service_id, action_type, 
        new_service_name, new_price, new_is_premium,
        changed_by
    )
    VALUES (
        NEW.service_id, 'INSERT',
        NEW.service_name, NEW.price, NEW.is_premium,
        USER()
    );
END$$
DELIMITER ;

-- Trigger: Validate service data before update
DELIMITER $$
CREATE TRIGGER trg_services_before_update
BEFORE UPDATE ON Services
FOR EACH ROW
BEGIN
    -- Validate price is positive
    IF NEW.price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service price must be greater than 0';
    END IF;
    
    -- Validate duration is positive
    IF NEW.duration_minutes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service duration must be greater than 0 minutes';
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit service updates
DELIMITER $$
CREATE TRIGGER trg_services_after_update
AFTER UPDATE ON Services
FOR EACH ROW
BEGIN
    INSERT INTO Services_Audit (
        service_id, action_type,
        old_service_name, new_service_name,
        old_price, new_price,
        old_is_premium, new_is_premium,
        changed_by
    )
    VALUES (
        NEW.service_id, 'UPDATE',
        OLD.service_name, NEW.service_name,
        OLD.price, NEW.price,
        OLD.is_premium, NEW.is_premium,
        USER()
    );
END$$
DELIMITER ;

-- Trigger: Audit service deletions
DELIMITER $$
CREATE TRIGGER trg_services_after_delete
AFTER DELETE ON Services
FOR EACH ROW
BEGIN
    INSERT INTO Services_Audit (
        service_id, action_type,
        old_service_name, old_price, old_is_premium,
        changed_by
    )
    VALUES (
        OLD.service_id, 'DELETE',
        OLD.service_name, OLD.price, OLD.is_premium,
        USER()
    );
END$$
DELIMITER ;

-- -----------------------------------------------------
-- 4. CUSTOMERS TRIGGERS
-- -----------------------------------------------------

-- Trigger: Normalize customer data before insert
DELIMITER $$
CREATE TRIGGER trg_customers_before_insert
BEFORE INSERT ON Customers
FOR EACH ROW
BEGIN
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    
    -- Trim and normalize full name
    IF NEW.full_name IS NOT NULL THEN
        SET NEW.full_name = TRIM(NEW.full_name);
    END IF;
END$$
DELIMITER ;

-- Trigger: Normalize customer data before update
DELIMITER $$
CREATE TRIGGER trg_customers_before_update
BEFORE UPDATE ON Customers
FOR EACH ROW
BEGIN
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    
    -- Trim and normalize full name
    IF NEW.full_name IS NOT NULL THEN
        SET NEW.full_name = TRIM(NEW.full_name);
    END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- 5. APPOINTMENTS TRIGGERS
-- -----------------------------------------------------

-- Trigger: Validate appointment data before insert
DELIMITER $$
CREATE TRIGGER trg_appointments_before_insert
BEFORE INSERT ON Appointments
FOR EACH ROW
BEGIN
    -- Validate appointment date is not in the past
    IF NEW.appointment_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appointment date cannot be in the past';
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL OR NEW.status = '' THEN
        SET NEW.status = 'Scheduled';
    END IF;
    
    -- Validate status is one of the allowed values
    IF NEW.status NOT IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid appointment status';
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit appointment insertions
DELIMITER $$
CREATE TRIGGER trg_appointments_after_insert
AFTER INSERT ON Appointments
FOR EACH ROW
BEGIN
    INSERT INTO Appointments_Audit (
        appointment_id, action_type,
        new_status, new_staff_id, new_appointment_date,
        changed_by
    )
    VALUES (
        NEW.appointment_id, 'INSERT',
        NEW.status, NEW.staff_id, NEW.appointment_date,
        USER()
    );
END$$
DELIMITER ;

-- Trigger: Validate appointment data before update
DELIMITER $$
CREATE TRIGGER trg_appointments_before_update
BEFORE UPDATE ON Appointments
FOR EACH ROW
BEGIN
    -- Validate appointment date is not in the past (only for future updates)
    IF NEW.appointment_date < CURDATE() AND OLD.appointment_date >= CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot move appointment to a past date';
    END IF;
    
    -- Validate status is one of the allowed values
    IF NEW.status NOT IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid appointment status';
    END IF;
END$$
DELIMITER ;

-- Trigger: Audit appointment updates
DELIMITER $$
CREATE TRIGGER trg_appointments_after_update
AFTER UPDATE ON Appointments
FOR EACH ROW
BEGIN
    INSERT INTO Appointments_Audit (
        appointment_id, action_type,
        old_status, new_status,
        old_staff_id, new_staff_id,
        old_appointment_date, new_appointment_date,
        changed_by
    )
    VALUES (
        NEW.appointment_id, 'UPDATE',
        OLD.status, NEW.status,
        OLD.staff_id, NEW.staff_id,
        OLD.appointment_date, NEW.appointment_date,
        USER()
    );
END$$
DELIMITER ;

-- Trigger: Audit appointment deletions
DELIMITER $$
CREATE TRIGGER trg_appointments_after_delete
AFTER DELETE ON Appointments
FOR EACH ROW
BEGIN
    INSERT INTO Appointments_Audit (
        appointment_id, action_type,
        old_status, old_staff_id, old_appointment_date,
        changed_by
    )
    VALUES (
        OLD.appointment_id, 'DELETE',
        OLD.status, OLD.staff_id, OLD.appointment_date,
        USER()
    );
END$$
DELIMITER ;

-- -----------------------------------------------------
-- 6. MESSAGES TRIGGERS
-- -----------------------------------------------------

-- Trigger: Normalize message data before insert
DELIMITER $$
CREATE TRIGGER trg_messages_before_insert
BEFORE INSERT ON Messages
FOR EACH ROW
BEGIN
    -- Normalize email to lowercase
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    
    -- Trim name and subject
    IF NEW.name IS NOT NULL THEN
        SET NEW.name = TRIM(NEW.name);
    END IF;
    
    IF NEW.subject IS NOT NULL THEN
        SET NEW.subject = TRIM(NEW.subject);
    END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- 7. ADMINS TRIGGERS
-- -----------------------------------------------------

-- Trigger: Validate admin data before insert
DELIMITER $$
CREATE TRIGGER trg_admins_before_insert
BEFORE INSERT ON Admins
FOR EACH ROW
BEGIN
    -- Ensure username is trimmed and not empty
    SET NEW.username = TRIM(NEW.username);
    
    IF LENGTH(NEW.username) < 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username must be at least 3 characters long';
    END IF;
    
    -- Ensure password_hash is not empty
    IF NEW.password_hash IS NULL OR LENGTH(NEW.password_hash) < 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid password hash';
    END IF;
END$$
DELIMITER ;

-- Trigger: Prevent deletion of the last admin
DELIMITER $$
CREATE TRIGGER trg_admins_before_delete
BEFORE DELETE ON Admins
FOR EACH ROW
BEGIN
    DECLARE admin_count INT;
    
    SELECT COUNT(*) INTO admin_count FROM Admins;
    
    IF admin_count <= 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the last admin account';
    END IF;
END$$
DELIMITER ;