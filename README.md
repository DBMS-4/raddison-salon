# Raddison Salon Website

A complete Node.js web application for Raddison Salon featuring appointment booking, service management, and customer interaction.

## Features

- **Service Display**: Browse all available salon services with prices and durations
- **Appointment Booking**: Book appointments with preferred staff and time slots
- **Real-time Availability**: Check available time slots for specific dates
- **Appointment Management**: View, complete, or cancel appointments
- **Responsive Design**: Mobile-friendly interface
- **MySQL Integration**: Connected to cloud database with salon data

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome

## Project Structure

```
raddison-salon/
├── public/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Styling
│   └── script.js           # Frontend JavaScript
├── server.js               # Express server and API routes
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
└── README.md              # This file
```

## Database Schema

The application uses the following MySQL tables:

- **Services**: Service details (name, price, duration)
- **Staff**: Employee information and roles
- **Customers**: Customer contact information
- **Appointments**: Booking details with relationships

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- MySQL database (local or cloud)
- Git (optional)

### 2. Installation

1. **Navigate to project directory:**
   ```bash
   cd "e:\DBMS Project\Website"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure database connection:**
   
   Edit the `.env` file with your database credentials:
   ```env
   DB_HOST=your_database_host
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   DB_NAME=raddison_salon
   DB_PORT=3306
   PORT=3000
   ```

4. **Setup database:**
   
   Run the provided SQL script to create tables and insert sample data:
   - Create database: `CREATE DATABASE raddison_salon;`
   - Execute the SQL commands from the attached SQL file

### 3. Running the Application

1. **Development mode (with auto-restart):**
   ```bash
   npm run dev
   ```

2. **Production mode:**
   ```bash
   npm start
   ```

3. **Access the website:**
   - Open your browser and go to: `http://localhost:3000`

## API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/staff` - Get all staff members
- `GET /api/customers` - Get all customers

### Appointments
- `GET /api/appointments` - Get all appointments with details
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id/status` - Update appointment status

### Booking
- `POST /api/customers` - Create new customer
- `GET /api/available-slots` - Get available time slots

## Usage Guide

### For Customers:
1. **Browse Services**: View all available services with prices
2. **Book Appointment**: Fill out the booking form with:
   - Personal details (name, phone, email, address)
   - Select desired service
   - Choose preferred staff (optional)
   - Pick date and available time slot
3. **View Appointments**: Check booking status and details

### For Staff/Admin:
1. **Manage Appointments**: View all bookings with filtering options
2. **Update Status**: Mark appointments as completed or cancelled
3. **Customer Management**: View customer information and history

## Features in Detail

### Appointment Booking System
- Real-time availability checking
- Time slot management (9 AM - 6 PM, 30-minute intervals)
- Staff assignment (optional)
- Automatic customer creation

### Responsive Design
- Mobile-first approach
- Hamburger menu for mobile devices
- Flexible grid layouts
- Touch-friendly interface

### Database Integration
- Secure MySQL connection
- Prepared statements for security
- Foreign key relationships
- Data validation

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check `.env` file configuration
   - Verify database server is running
   - Ensure database exists and tables are created

2. **Port Already in Use:**
   - Change PORT in `.env` file
   - Kill existing Node.js processes

3. **Module Not Found:**
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility

## Future Enhancements

- User authentication and login system
- Payment integration
- Email notifications
- SMS reminders
- Staff scheduling system
- Inventory management
- Customer loyalty program

## Support

For technical support or questions:
- Email: support@raddisonsalon.com
- Phone: +91 98765 43210

## License

This project is licensed under the ISC License.