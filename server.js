const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Routes

// Get all services
app.get('/api/services', (req, res) => {
    const query = 'SELECT * FROM Services ORDER BY service_name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching services:', err);
            res.status(500).json({ error: 'Failed to fetch services' });
            return;
        }
        res.json(results);
    });
});

// Get all staff
app.get('/api/staff', (req, res) => {
    const query = 'SELECT staff_id, full_name, role, phone, email FROM Staff ORDER BY full_name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching staff:', err);
            res.status(500).json({ error: 'Failed to fetch staff' });
            return;
        }
        res.json(results);
    });
});

// Get all customers
app.get('/api/customers', (req, res) => {
    const query = 'SELECT * FROM Customers ORDER BY full_name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            res.status(500).json({ error: 'Failed to fetch customers' });
            return;
        }
        res.json(results);
    });
});

// Get all appointments with details
app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            c.full_name as customer_name,
            c.phone as customer_phone,
            s.full_name as staff_name,
            sv.service_name,
            sv.price,
            sv.duration_minutes
        FROM Appointments a
        JOIN Customers c ON a.customer_id = c.customer_id
        LEFT JOIN Staff s ON a.staff_id = s.staff_id
        JOIN Services sv ON a.service_id = sv.service_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching appointments:', err);
            res.status(500).json({ error: 'Failed to fetch appointments' });
            return;
        }
        res.json(results);
    });
});

// Create new customer
app.post('/api/customers', (req, res) => {
    const { full_name, phone, email, address } = req.body;
    const query = 'INSERT INTO Customers (full_name, phone, email, address) VALUES (?, ?, ?, ?)';
    
    db.query(query, [full_name, phone, email, address], (err, results) => {
        if (err) {
            console.error('Error creating customer:', err);
            res.status(500).json({ error: 'Failed to create customer' });
            return;
        }
        res.json({ 
            message: 'Customer created successfully', 
            customer_id: results.insertId 
        });
    });
});

// Create new appointment
app.post('/api/appointments', (req, res) => {
    const { customer_id, staff_id, service_id, appointment_date, appointment_time } = req.body;
    const query = 'INSERT INTO Appointments (customer_id, staff_id, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [customer_id, staff_id, service_id, appointment_date, appointment_time], (err, results) => {
        if (err) {
            console.error('Error creating appointment:', err);
            res.status(500).json({ error: 'Failed to create appointment' });
            return;
        }
        res.json({ 
            message: 'Appointment created successfully', 
            appointment_id: results.insertId 
        });
    });
});

// Update appointment status
app.put('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const query = 'UPDATE Appointments SET status = ? WHERE appointment_id = ?';
    
    db.query(query, [status, id], (err, results) => {
        if (err) {
            console.error('Error updating appointment:', err);
            res.status(500).json({ error: 'Failed to update appointment' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        res.json({ message: 'Appointment status updated successfully' });
    });
});

// Get available time slots for a specific date and staff
app.get('/api/available-slots', (req, res) => {
    const { date, staff_id } = req.query;
    
    if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
    }
    
    let query = `
        SELECT appointment_time 
        FROM Appointments 
        WHERE appointment_date = ? AND status != 'Cancelled'
    `;
    
    let params = [date];
    
    if (staff_id) {
        query += ' AND staff_id = ?';
        params.push(staff_id);
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching booked slots:', err);
            res.status(500).json({ error: 'Failed to fetch available slots' });
            return;
        }
        
        // Generate all possible time slots (9 AM to 6 PM, 30-minute intervals)
        const allSlots = [];
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 18 && minute > 0) break; // Stop at 6:00 PM
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                allSlots.push(timeSlot);
            }
        }
        
        // Filter out booked slots
        const bookedTimes = results.map(row => row.appointment_time);
        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
        
        res.json(availableSlots);
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});