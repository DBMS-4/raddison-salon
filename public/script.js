// Global variables
let services = [];
let staff = [];
let appointments = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    showLoading(true);
    
    try {
        await Promise.all([
            loadServices(),
            loadStaff(),
            loadAppointments()
        ]);
        
        populateServiceSelect();
        populateStaffSelect();
        displayServices();
        displayAppointments();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').min = today;
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showModal('Error loading data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger?.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
            }
        });
    });

    // Booking form submission
    document.getElementById('bookingForm')?.addEventListener('submit', handleBookingSubmission);

    // Date change for time slots
    document.getElementById('appointmentDate')?.addEventListener('change', handleDateChange);

    // Appointment status filter
    document.getElementById('statusFilter')?.addEventListener('change', filterAppointments);

    // Modal close
    document.querySelector('.close')?.addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function loadServices() {
    services = await apiCall('/services');
}

async function loadStaff() {
    staff = await apiCall('/staff');
}

async function loadAppointments() {
    appointments = await apiCall('/appointments');
}

async function loadAvailableSlots(date, staffId = null) {
    const params = new URLSearchParams({ date });
    if (staffId) params.append('staff_id', staffId);
    
    return await apiCall(`/available-slots?${params}`);
}

async function createCustomer(customerData) {
    return await apiCall('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
    });
}

async function createAppointment(appointmentData) {
    return await apiCall('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    });
}

async function updateAppointmentStatus(appointmentId, status) {
    return await apiCall(`/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

// Display Functions
function populateServiceSelect() {
    const serviceSelect = document.getElementById('serviceSelect');
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = '<option value="">Choose a service...</option>';
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.service_id;
        option.textContent = `${service.service_name} - ₹${service.price} (${service.duration_minutes} min)`;
        serviceSelect.appendChild(option);
    });
}

function populateStaffSelect() {
    const staffSelect = document.getElementById('staffSelect');
    if (!staffSelect) return;
    
    staffSelect.innerHTML = '<option value="">Any available staff</option>';
    
    staff.forEach(member => {
        const option = document.createElement('option');
        option.value = member.staff_id;
        option.textContent = `${member.full_name} (${member.role})`;
        staffSelect.appendChild(option);
    });
}

function displayServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        
        // Get appropriate icon for service
        const icon = getServiceIcon(service.service_name);
        
        serviceCard.innerHTML = `
            <div class="service-icon">
                <i class="${icon}"></i>
            </div>
            <h3>${service.service_name}</h3>
            <p>${service.description || 'Professional service with expert care'}</p>
            <div class="service-price">₹${service.price}</div>
            <div class="service-duration">${service.duration_minutes} minutes</div>
        `;
        
        servicesGrid.appendChild(serviceCard);
    });
}

function displayAppointments(filteredAppointments = null) {
    const appointmentsGrid = document.getElementById('appointmentsGrid');
    if (!appointmentsGrid) return;
    
    const appointmentsToShow = filteredAppointments || appointments;
    appointmentsGrid.innerHTML = '';
    
    if (appointmentsToShow.length === 0) {
        appointmentsGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No appointments found.</p>';
        return;
    }
    
    appointmentsToShow.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        
        const date = new Date(appointment.appointment_date).toLocaleDateString();
        const time = appointment.appointment_time;
        
        appointmentCard.innerHTML = `
            <div class="appointment-header">
                <div class="appointment-id">ID: ${appointment.appointment_id}</div>
                <div class="appointment-status status-${appointment.status.toLowerCase()}">
                    ${appointment.status}
                </div>
            </div>
            <div class="appointment-details">
                <p><strong>Customer:</strong> ${appointment.customer_name}</p>
                <p><strong>Phone:</strong> ${appointment.customer_phone}</p>
                <p><strong>Service:</strong> ${appointment.service_name}</p>
                <p><strong>Staff:</strong> ${appointment.staff_name || 'Not assigned'}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Price:</strong> ₹${appointment.price}</p>
                <p><strong>Duration:</strong> ${appointment.duration_minutes} minutes</p>
            </div>
            ${appointment.status === 'Scheduled' ? `
                <div class="appointment-actions">
                    <button class="btn-complete" onclick="updateStatus(${appointment.appointment_id}, 'Completed')">
                        Complete
                    </button>
                    <button class="btn-cancel" onclick="updateStatus(${appointment.appointment_id}, 'Cancelled')">
                        Cancel
                    </button>
                </div>
            ` : ''}
        `;
        
        appointmentsGrid.appendChild(appointmentCard);
    });
}

// Event Handlers
async function handleBookingSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        customerName: formData.get('customerName'),
        customerPhone: formData.get('customerPhone'),
        customerEmail: formData.get('customerEmail'),
        customerAddress: formData.get('customerAddress'),
        serviceId: formData.get('serviceSelect'),
        staffId: formData.get('staffSelect') || null,
        appointmentDate: formData.get('appointmentDate'),
        appointmentTime: formData.get('appointmentTime')
    };
    
    // Validate required fields
    if (!bookingData.customerName || !bookingData.customerPhone || !bookingData.serviceId || 
        !bookingData.appointmentDate || !bookingData.appointmentTime) {
        showModal('Please fill in all required fields.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Create customer first
        const customerData = {
            full_name: bookingData.customerName,
            phone: bookingData.customerPhone,
            email: bookingData.customerEmail || null,
            address: bookingData.customerAddress || null
        };
        
        const customerResponse = await createCustomer(customerData);
        
        // Create appointment
        const appointmentData = {
            customer_id: customerResponse.customer_id,
            staff_id: bookingData.staffId,
            service_id: parseInt(bookingData.serviceId),
            appointment_date: bookingData.appointmentDate,
            appointment_time: bookingData.appointmentTime
        };
        
        await createAppointment(appointmentData);
        
        // Refresh appointments
        await loadAppointments();
        displayAppointments();
        
        // Reset form
        e.target.reset();
        document.getElementById('appointmentTime').innerHTML = '<option value="">Select date first</option>';
        
        showModal('Appointment booked successfully!', 'success');
        
    } catch (error) {
        console.error('Booking error:', error);
        showModal('Error booking appointment. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleDateChange(e) {
    const selectedDate = e.target.value;
    const staffId = document.getElementById('staffSelect').value;
    const timeSelect = document.getElementById('appointmentTime');
    
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">Select date first</option>';
        return;
    }
    
    showLoading(true);
    
    try {
        const availableSlots = await loadAvailableSlots(selectedDate, staffId || null);
        
        timeSelect.innerHTML = '<option value="">Choose a time...</option>';
        
        availableSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = formatTime(slot);
            timeSelect.appendChild(option);
        });
        
        if (availableSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No slots available</option>';
        }
        
    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSelect.innerHTML = '<option value="">Error loading slots</option>';
    } finally {
        showLoading(false);
    }
}

function filterAppointments() {
    const filterValue = document.getElementById('statusFilter').value;
    
    if (!filterValue) {
        displayAppointments();
        return;
    }
    
    const filtered = appointments.filter(appointment => 
        appointment.status === filterValue
    );
    
    displayAppointments(filtered);
}

async function updateStatus(appointmentId, status) {
    showLoading(true);
    
    try {
        await updateAppointmentStatus(appointmentId, status);
        
        // Update local appointments array
        const appointmentIndex = appointments.findIndex(app => app.appointment_id === appointmentId);
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = status;
        }
        
        // Refresh display
        filterAppointments();
        
        showModal(`Appointment ${status.toLowerCase()} successfully!`, 'success');
        
    } catch (error) {
        console.error('Error updating appointment:', error);
        showModal('Error updating appointment. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function getServiceIcon(serviceName) {
    const iconMap = {
        'Haircut': 'fas fa-cut',
        'Hair Coloring': 'fas fa-palette',
        'Hair Styling': 'fas fa-magic',
        'Beard Grooming': 'fas fa-user',
        'Facial': 'fas fa-spa',
        'Manicure': 'fas fa-hand-paper',
        'Pedicure': 'fas fa-foot',
        'Hair Spa': 'fas fa-leaf'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (serviceName.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    
    return 'fas fa-star'; // Default icon
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showModal(message, type = 'info') {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    
    if (modal && modalMessage) {
        modalMessage.innerHTML = `
            <div style="color: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : '#1976d2'}">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}" 
                   style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.1rem; margin: 0;">${message}</p>
            </div>
        `;
        modal.style.display = 'block';
        
        // Auto close after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(closeModal, 3000);
        }
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}