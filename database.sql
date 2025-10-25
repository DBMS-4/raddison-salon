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
('Classic Haircut', 'Professional haircut with styling', 35.00, 45, 0),
('Women\'s Haircut', 'Haircut with wash and blow dry', 55.00, 60, 0),
('Hair Coloring', 'Full hair coloring service', 85.00, 120, 0),
('Highlights', 'Partial or full highlights', 95.00, 150, 0),
('Blow Dry & Style', 'Professional blow dry and styling', 40.00, 30, 0),
('Basic Facial', 'Deep cleansing facial treatment', 60.00, 60, 0),
('Anti-Aging Facial', 'Advanced anti-aging treatment', 90.00, 75, 0),
('Acne Treatment', 'Specialized acne care facial', 70.00, 60, 0),
('Beard Trim', 'Professional beard shaping and trim', 25.00, 30, 0),
('Hot Towel Shave', 'Traditional hot towel straight razor shave', 35.00, 45, 0),
('Manicure', 'Complete nail care for hands', 30.00, 45, 0),
('Pedicure', 'Complete nail care for feet', 45.00, 60, 0);

INSERT INTO Services (service_name, description, price, duration_minutes, is_premium) VALUES
('Luxury Spa Package', 'Complete spa experience with massage, facial, and body treatment', 250.00, 180, 1),
('Gold Facial Treatment', 'Premium facial with 24k gold infusion for ultimate rejuvenation', 180.00, 90, 1),
('Diamond Glow Treatment', 'Advanced exfoliation and infusion treatment for radiant skin', 200.00, 75, 1),
('Platinum Hair Treatment', 'Intensive hair restoration and keratin treatment', 150.00, 120, 1),
('VIP Bridal Package', 'Complete bridal preparation including hair, makeup, and skincare', 400.00, 240, 1),
('Executive Grooming Suite', 'Premium grooming experience for professionals', 120.00, 90, 1);

INSERT INTO Appointments (customer_id, service_id, staff_id, appointment_date, appointment_time, status, notes) VALUES
(1, 2, 1, '2024-11-15', '10:00:00', 'Scheduled', 'Customer prefers layered cut'),
(2, 1, 2, '2024-11-15', '14:00:00', 'Scheduled', NULL),
(3, 6, 3, '2024-11-16', '11:00:00', 'Scheduled', 'First time customer, sensitive skin'),
(4, 11, 5, '2024-11-16', '15:30:00', 'Scheduled', NULL),
(5, 13, 1, '2024-11-17', '09:00:00', 'Scheduled', 'Anniversary special - wants luxury experience');

INSERT INTO Admins (username, password_hash) VALUES
('admin', '$2b$10$jerPWO5ZLWQ2lSmt5Cc4ee0lgfrEpGwQjyDjDDzEc4wBj9MT1UUQy');

