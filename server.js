const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
};

let db;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000;


function createDatabaseConnection() {
    db = mysql.createConnection(dbConfig);
    
    db.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err);
            console.error('Connection details:');
            console.error('Host:', process.env.DB_HOST);
            console.error('User:', process.env.DB_USER);
            console.error('Database:', process.env.DB_NAME);
            console.error('Port:', process.env.DB_PORT || 3306);
            
            handleDisconnect();
            return;
        }
        console.log('Connected to MySQL database successfully!');
        console.log('Database:', process.env.DB_NAME);
        reconnectAttempts = 0;
    });

    db.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
            err.code === 'ECONNRESET' || 
            err.code === 'ETIMEDOUT' ||
            err.fatal) {
            console.log('Connection lost. Attempting to reconnect...');
            handleDisconnect();
        } else {
            throw err;
        }
    });
}


function handleDisconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check your database server.`);
        return;
    }

    reconnectAttempts++;
    const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    
    setTimeout(() => {
        console.log('Attempting to reconnect to database...');
        createDatabaseConnection();
    }, delay);
}

createDatabaseConnection();

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-app-name.onrender.com', 'https://raddison-salon.onrender.com'] 
        : true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading the page. Please try again.');
        }
    });
});

app.get('/health', (req, res) => {
    const fs = require('fs');
    const publicDir = path.join(__dirname, 'public');
    const files = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : ['public directory not found'];
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        directory: __dirname,
        publicPath: publicDir,
        files: files,
        database: 'Connected to: ' + process.env.DB_NAME
    });
});

app.get('/api/services', (req, res) => {
    const query = 'SELECT * FROM Services WHERE is_premium = FALSE OR is_premium IS NULL ORDER BY service_name';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching services:', err);
            res.status(500).json({ error: 'Failed to fetch services' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/premium', (req, res) => {
    const query = 'SELECT * FROM Services WHERE is_premium = TRUE ORDER BY service_name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching premium services:', err);
            res.status(500).json({ error: 'Failed to fetch premium services' });
            return;
        }
        console.log(`Fetched ${results.length} premium services from database`);
        res.json(results);
    });
});

app.get('/api/all-services', (req, res) => {
    const query = 'SELECT * FROM Services ORDER BY is_premium DESC, service_name';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all services:', err);
            res.status(500).json({ error: 'Failed to fetch all services' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/services', (req, res) => {
    const { service_name, description, price, duration_minutes, is_premium } = req.body;
    
    if (!service_name || !price || !duration_minutes) {
        res.status(400).json({ error: 'Service name, price, and duration are required' });
        return;
    }
    
    const premiumValue = is_premium ? 1 : 0;
    const serviceDescription = description && description.trim() ? description.trim() : null;
    
    const query = 'INSERT INTO Services (service_name, description, price, duration_minutes, is_premium) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [service_name, serviceDescription, parseFloat(price), parseInt(duration_minutes), premiumValue], (err, result) => {
        if (err) {
            console.error('Error creating service:', err);
            res.status(500).json({ error: 'Failed to create service' });
            return;
        }
        
        res.status(201).json({ 
            message: 'Service created successfully', 
            serviceId: result.insertId 
        });
    });
});

app.put('/api/services/:id', (req, res) => {
    const serviceId = req.params.id;
    const { service_name, description, price, duration_minutes, is_premium } = req.body;
    
    if (!service_name || !price || !duration_minutes) {
        res.status(400).json({ error: 'Service name, price, and duration are required' });
        return;
    }
    
    const premiumValue = is_premium ? 1 : 0;
    const serviceDescription = description && description.trim() ? description.trim() : null;
    
    const query = 'UPDATE Services SET service_name = ?, description = ?, price = ?, duration_minutes = ?, is_premium = ? WHERE service_id = ?';
    
    db.query(query, [service_name, serviceDescription, parseFloat(price), parseInt(duration_minutes), premiumValue, serviceId], (err, result) => {
        if (err) {
            console.error('Error updating service:', err);
            res.status(500).json({ error: 'Failed to update service' });
            return;
        }
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        
        res.json({ message: 'Service updated successfully' });
    });
});

app.delete('/api/services/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Services WHERE service_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting service:', err);
            res.status(500).json({ error: 'Failed to delete service' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        res.json({ message: 'Service deleted' });
    });
});

app.get('/api/staff', (req, res) => {
    const query = 'SELECT staff_id, full_name, role, phone, email, salary FROM Staff ORDER BY full_name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching staff:', err);
            res.status(500).json({ error: 'Failed to fetch staff' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/staff', (req, res) => {
    const { full_name, role, phone, email, salary } = req.body;
    if (!full_name || !role || !phone || !email) {
        res.status(400).json({ error: 'full_name, role, phone, and email are required' });
        return;
    }
    const s = salary !== undefined ? parseFloat(salary) : 0;
    const q = 'INSERT INTO Staff (full_name, role, phone, email, hire_date, salary) VALUES (?, ?, ?, ?, CURDATE(), ?)';
    db.query(q, [full_name.trim(), role.trim(), phone.trim(), email.trim(), s], (err, result) => {
        if (err) {
            console.error('Error creating staff:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'Phone or email already exists' });
            } else {
                res.status(500).json({ error: 'Failed to create staff' });
            }
            return;
        }
        res.json({ message: 'Staff created', staff_id: result.insertId });
    });
});

app.put('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    const { full_name, role, phone, email, salary } = req.body;
    if (!full_name || !role || !phone || !email) {
        res.status(400).json({ error: 'full_name, role, phone, and email are required' });
        return;
    }
    const s = salary !== undefined ? parseFloat(salary) : 0;
    const q = 'UPDATE Staff SET full_name = ?, role = ?, phone = ?, email = ?, salary = ? WHERE staff_id = ?';
    db.query(q, [full_name.trim(), role.trim(), phone.trim(), email.trim(), s, id], (err, result) => {
        if (err) {
            console.error('Error updating staff:', err);
            res.status(500).json({ error: 'Failed to update staff' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.json({ message: 'Staff updated' });
    });
});

app.delete('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Staff WHERE staff_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting staff:', err);
            res.status(500).json({ error: 'Failed to delete staff' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.json({ message: 'Staff deleted' });
    });
});

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

app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.notes,
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

app.post('/api/customers', (req, res) => {
    let { full_name, phone, email } = req.body;

    if (!full_name || !phone || !email) {
        res.status(400).json({ error: 'full_name, phone and email are required' });
        return;
    }

    full_name = full_name.trim();
    phone = phone.trim();
    email = email.trim().toLowerCase();

    const findQuery = 'SELECT customer_id FROM Customers WHERE phone = ? OR email = ? LIMIT 1';
    db.query(findQuery, [phone, email], (findErr, findResults) => {
        if (findErr) {
            console.error('Error checking existing customer:', findErr);
            res.status(500).json({ error: 'Failed to check existing customer' });
            return;
        }

        if (findResults.length > 0) {
            const existingId = findResults[0].customer_id;
            res.json({ message: 'Customer reused', customer_id: existingId, reused: true });
            return;
        }

        const insertQuery = 'INSERT INTO Customers (full_name, phone, email) VALUES (?, ?, ?)';
        db.query(insertQuery, [full_name, phone, email], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Error creating customer:', insertErr);
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({ error: 'Customer with same phone or email already exists' });
                } else {
                    res.status(500).json({ error: 'Failed to create customer' });
                }
                return;
            }
            res.json({ 
                message: 'Customer created successfully', 
                customer_id: insertResults.insertId,
                reused: false
            });
        });
    });
});

app.post('/api/appointments', (req, res) => {
    let { customer_id, staff_id, service_id, appointment_date, appointment_time, notes } = req.body;

    console.log('Incoming appointment payload:', req.body);

    if (!customer_id || !service_id || !appointment_date || !appointment_time) {
            res.status(400).json({ error: 'customer_id, service_id, appointment_date, appointment_time are required' });
        return;
    }

    customer_id = parseInt(customer_id, 10);
    service_id = parseInt(service_id, 10);
    if (staff_id === '' || staff_id === undefined || staff_id === null) {
        staff_id = null;
    } else {
        staff_id = parseInt(staff_id, 10);
        if (isNaN(staff_id)) staff_id = null;
    }

    if ([customer_id, service_id].some(isNaN)) {
        res.status(400).json({ error: 'customer_id and service_id must be valid integers' });
        return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
        res.status(400).json({ error: 'appointment_date must be in YYYY-MM-DD format' });
        return;
    }

    if (/^\d{2}:\d{2}$/.test(appointment_time)) {
        appointment_time = appointment_time + ':00';
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(appointment_time)) {
        res.status(400).json({ error: 'appointment_time must be in HH:MM or HH:MM:SS format' });
        return;
    }

    const appointmentNotes = notes && notes.trim() ? notes.trim() : null;

    const query = 'INSERT INTO Appointments (customer_id, staff_id, service_id, appointment_date, appointment_time, notes) VALUES (?, ?, ?, ?, ?, ?)';
    const proceedInsert = (finalStaffId) => {
        db.query(query, [customer_id, finalStaffId, service_id, appointment_date, appointment_time, appointmentNotes], (err, results) => {
            if (err) {
                console.error('Error creating appointment:', err);
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    res.status(400).json({ error: 'Invalid foreign key: ensure customer_id, staff_id (if provided), and service_id exist', detail: err.code });
                } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
                    res.status(400).json({ error: 'Invalid value format (likely time/date)', detail: err.code });
                } else {
                    res.status(500).json({ error: 'Failed to create appointment', detail: err.code });
                }
                return;
            }
            console.log('Appointment created with ID:', results.insertId, 'staff:', finalStaffId);
            res.json({ 
                message: 'Appointment created successfully', 
                appointment_id: results.insertId,
                staff_assigned: finalStaffId,
                auto_assigned: staff_id === null
            });
        });
    };

    if (staff_id === null) {
        const busyQuery = `
            SELECT staff_id
            FROM Appointments
            WHERE appointment_date = ?
              AND appointment_time = ?
              AND status = 'Scheduled'
              AND staff_id IS NOT NULL
        `;
        db.query(busyQuery, [appointment_date, appointment_time], (busyErr, busyResults) => {
            if (busyErr) {
                console.error('Error checking busy staff:', busyErr);
                res.status(500).json({ error: 'Failed to auto-assign staff' });
                return;
            }
            const busyIds = busyResults.map(r => r.staff_id);
            let freeQuery = 'SELECT staff_id FROM Staff';
            let params = [];
            if (busyIds.length) {
                freeQuery += ' WHERE staff_id NOT IN (' + busyIds.map(() => '?').join(',') + ')';
                params = busyIds;
            }
            freeQuery += ' ORDER BY staff_id LIMIT 1';
            db.query(freeQuery, params, (freeErr, freeResults) => {
                if (freeErr) {
                    console.error('Error finding free staff:', freeErr);
                    res.status(500).json({ error: 'Failed to auto-assign staff' });
                    return;
                }
                if (!freeResults.length) {
                    res.status(409).json({ error: 'No staff available at that time' });
                    return;
                }
                const assignedId = freeResults[0].staff_id;
                console.log('Auto-assigned staff_id:', assignedId);
                proceedInsert(assignedId);
            });
        });
    } else {
        const conflictQuery = `
            SELECT appointment_id
            FROM Appointments
            WHERE appointment_date = ?
              AND appointment_time = ?
              AND staff_id = ?
              AND status = 'Scheduled'
            LIMIT 1
        `;
        db.query(conflictQuery, [appointment_date, appointment_time, staff_id], (confErr, confResults) => {
            if (confErr) {
                console.error('Error checking staff conflict:', confErr);
                res.status(500).json({ error: 'Failed to verify staff availability' });
                return;
            }
            if (confResults.length) {
                res.status(409).json({ error: 'Selected staff is already booked for that slot' });
                return;
            }
            proceedInsert(staff_id);
        });
    }
});

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

app.put('/api/appointments/:id/staff', (req, res) => {
    const { id } = req.params;
    const { staff_id } = req.body;
    const query = 'UPDATE Appointments SET staff_id = ? WHERE appointment_id = ?';
    
    db.query(query, [staff_id, id], (err, results) => {
        if (err) {
            console.error('Error updating appointment staff:', err);
            res.status(500).json({ error: 'Failed to update staff assignment' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        res.json({ message: 'Staff assignment updated successfully' });
    });
});

app.get('/api/available-slots', (req, res) => {
    const { date, staff_id } = req.query;
    
    if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
    }
    
    let query = `
        SELECT appointment_time 
        FROM Appointments 
        WHERE appointment_date = ? AND status = 'Scheduled'
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
        
        const allSlots = [];
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 18 && minute > 0) break;
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                allSlots.push(timeSlot);
            }
        }
        
        const bookedTimes = results.map(row => row.appointment_time);
        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
        
        res.json(availableSlots);
    });
});

app.get('/api/available-staff', (req, res) => {
    let { date, time } = req.query;

    if (!date || !time) {
        res.status(400).json({ error: 'date and time query params are required' });
        return;
    }

    if (/^\d{2}:\d{2}$/.test(time)) time = time + ':00';
    if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        res.status(400).json({ error: 'time must be in HH:MM or HH:MM:SS format' });
        return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
        return;
    }

    const bookedQuery = `
        SELECT staff_id
        FROM Appointments
        WHERE appointment_date = ?
          AND appointment_time = ?
          AND status = 'Scheduled'
          AND staff_id IS NOT NULL
    `;
    db.query(bookedQuery, [date, time], (bookErr, bookedResults) => {
        if (bookErr) {
            console.error('Error fetching booked staff:', bookErr);
            res.status(500).json({ error: 'Failed to compute availability' });
            return;
        }
        const bookedIds = bookedResults.map(r => r.staff_id);
        let staffQuery = 'SELECT staff_id, full_name, role FROM Staff';
        let params = [];
        if (bookedIds.length) {
            staffQuery += ' WHERE staff_id NOT IN (' + bookedIds.map(() => '?').join(',') + ')';
            params = bookedIds;
        }
        staffQuery += ' ORDER BY full_name';
        db.query(staffQuery, params, (availErr, available) => {
            if (availErr) {
                console.error('Error fetching available staff list:', availErr);
                res.status(500).json({ error: 'Failed to fetch available staff' });
                return;
            }
            res.json({
                date,
                time,
                available_count: available.length,
                staff: available
            });
        });
    });
});

app.get('/api/messages', (req, res) => {
    const q = 'SELECT message_id, name, email, subject, message, created_at FROM Messages ORDER BY created_at DESC';
    db.query(q, (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            res.status(500).json({ error: 'Failed to fetch messages' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/messages', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        res.status(400).json({ error: 'name, email and message are required' });
        return;
    }
    const q = 'INSERT INTO Messages (name, email, subject, message) VALUES (?, ?, ?, ?)';
    db.query(q, [name.trim(), email.trim().toLowerCase(), subject || null, message.trim()], (err, result) => {
        if (err) {
            console.error('Error saving message:', err);
            res.status(500).json({ error: 'Failed to save message' });
            return;
        }
        res.json({ message: 'Message saved', message_id: result.insertId });
    });
});

app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const q = 'DELETE FROM Messages WHERE message_id = ?';
    db.query(q, [id], (err, result) => {
        if (err) {
            console.error('Error deleting message:', err);
            res.status(500).json({ error: 'Failed to delete message' });
            return;
        }
        res.json({ message: 'Message deleted' });
    });
});

app.get('/api/admin/stats', (req, res) => {
    const qAppointments = `
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM Appointments
    `;
    db.query(qAppointments, (err, rows) => {
        if (err) {
            console.error('Error computing appointment stats:', err);
            res.status(500).json({ error: 'Failed to compute stats' });
            return;
        }
        const stats = rows[0] || { total: 0, scheduled: 0, completed: 0, cancelled: 0 };
        
        db.query('SELECT COUNT(*) AS customers FROM Customers', (cErr, cRows) => {
            if (cErr) {
                console.error('Error counting customers:', cErr);
                res.status(500).json({ error: 'Failed to compute stats' });
                return;
            }
            stats.customers = cRows[0]?.customers || 0;
            
            db.query('SELECT COUNT(*) AS messages FROM Messages', (mErr, mRows) => {
                if (mErr) {
                    console.error('Error counting messages:', mErr);
                    res.status(500).json({ error: 'Failed to compute stats' });
                    return;
                }
                stats.messages = mRows[0]?.messages || 0;
                
                db.query(`
                    SELECT SUM(sv.price) AS revenue 
                    FROM Appointments a 
                    JOIN Services sv ON a.service_id = sv.service_id 
                    WHERE a.status = 'Completed'
                `, (rErr, rRows) => {
                    if (rErr) {
                        console.error('Error calculating revenue:', rErr);
                        stats.revenue = 0;
                    } else {
                        stats.revenue = rRows[0]?.revenue || 0;
                    }
                    res.json(stats);
                });
            });
        });
    });
});

app.get('/api/admins', (req, res) => {
    const q = 'SELECT admin_id, username, created_at FROM Admins ORDER BY created_at DESC';
    db.query(q, (err, rows) => {
        if (err) {
            console.error('Error fetching admins:', err);
            res.status(500).json({ error: 'Failed to fetch admins' });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'username and password are required' });
        return;
    }
    const q = 'SELECT admin_id, username, password_hash FROM Admins WHERE username = ? LIMIT 1';
    db.query(q, [username], (err, rows) => {
        if (err) {
            console.error('Error during admin lookup:', err);
            res.status(500).json({ error: 'Login failed' });
            return;
        }
        if (!rows.length) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const admin = rows[0];
        bcrypt.compare(password, admin.password_hash, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).json({ error: 'Login failed' });
                return;
            }
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            res.json({ message: 'Login successful', admin: { admin_id: admin.admin_id, username: admin.username } });
        });
    });
});

app.post('/api/admins', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'username and password are required' });
        return;
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ error: 'Failed to create admin' });
            return;
        }
        const q = 'INSERT INTO Admins (username, password_hash) VALUES (?, ?)';
        db.query(q, [username.trim(), hash], (err, result) => {
            if (err) {
                console.error('Error creating admin:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({ error: 'Username already exists' });
                } else {
                    res.status(500).json({ error: 'Failed to create admin' });
                }
                return;
            }
            res.json({ message: 'Admin created', admin_id: result.insertId });
        });
    });
});

app.delete('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
        res.status(400).json({ error: 'Password is required to delete admin' });
        return;
    }
    
    db.query('SELECT password_hash FROM Admins WHERE admin_id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error checking admin password:', err);
            res.status(500).json({ error: 'Failed to verify admin' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        
        const admin = results[0];
        
        bcrypt.compare(password, admin.password_hash, (compareErr, isMatch) => {
            if (compareErr) {
                console.error('Error comparing passwords:', compareErr);
                res.status(500).json({ error: 'Failed to verify password' });
                return;
            }
            
            if (!isMatch) {
                res.status(401).json({ error: 'Incorrect password' });
                return;
            }
            
            db.query('SELECT COUNT(*) as count FROM Admins', (countErr, countResults) => {
                if (countErr) {
                    console.error('Error counting admins:', countErr);
                    res.status(500).json({ error: 'Failed to verify admin count' });
                    return;
                }
                
                const adminCount = countResults[0].count;
                
                if (adminCount <= 1) {
                    res.status(400).json({ error: 'Cannot delete the last admin account' });
                    return;
                }
                
                db.query('DELETE FROM Admins WHERE admin_id = ?', [id], (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error('Error deleting admin:', deleteErr);
                        res.status(500).json({ error: 'Failed to delete admin' });
                        return;
                    }
                    res.json({ message: 'Admin deleted successfully' });
                });
            });
        });
    });
});

app.put('/api/admins/:id/change-password', (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
    }
    
    if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters long' });
        return;
    }
    
    db.query('SELECT password_hash FROM Admins WHERE admin_id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error checking current admin password:', err);
            res.status(500).json({ error: 'Failed to verify current password' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        
        const admin = results[0];
        
        bcrypt.compare(currentPassword, admin.password_hash, (compareErr, isMatch) => {
            if (compareErr) {
                console.error('Error comparing passwords:', compareErr);
                res.status(500).json({ error: 'Failed to verify current password' });
                return;
            }
            
            if (!isMatch) {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            
            bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    console.error('Error hashing new password:', hashErr);
                    res.status(500).json({ error: 'Failed to process new password' });
                    return;
                }
                
                db.query('UPDATE Admins SET password_hash = ? WHERE admin_id = ?', [hashedPassword, id], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Error updating admin password:', updateErr);
                        res.status(500).json({ error: 'Failed to update password' });
                        return;
                    }
                    
                    if (updateResult.affectedRows === 0) {
                        res.status(404).json({ error: 'Admin not found' });
                        return;
                    }
                    
                    res.json({ message: 'Password changed successfully' });
                });
            });
        });
    });
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Appointments WHERE appointment_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting appointment:', err);
            res.status(500).json({ error: 'Failed to delete appointment' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        res.json({ message: 'Appointment deleted successfully' });
    });
});

app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    let { full_name, phone, email } = req.body;

    if (!full_name || !phone || !email) {
        res.status(400).json({ error: 'full_name, phone and email are required' });
        return;
    }

    full_name = full_name.trim();
    phone = phone.trim();
    email = email.trim().toLowerCase();

    const query = 'UPDATE Customers SET full_name = ?, phone = ?, email = ? WHERE customer_id = ?';
    db.query(query, [full_name, phone, email, id], (err, result) => {
        if (err) {
            console.error('Error updating customer:', err);
            res.status(500).json({ error: 'Failed to update customer' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json({ message: 'Customer updated successfully' });
    });
});


app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Appointments WHERE customer_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting customer appointments:', err);
            res.status(500).json({ error: 'Failed to delete customer appointments' });
            return;
        }
        
        db.query('DELETE FROM Customers WHERE customer_id = ?', [id], (err, result) => {
            if (err) {
                console.error('Error deleting customer:', err);
                res.status(500).json({ error: 'Failed to delete customer' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Customer not found' });
                return;
            }
            res.json({ message: 'Customer and associated appointments deleted successfully' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});