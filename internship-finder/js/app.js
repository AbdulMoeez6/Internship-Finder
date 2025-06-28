// js/app.js

// --- GLOBAL VARIABLES & CONSTANTS ---
const API_URL = 'http://localhost:5000/api';
const SPINNER_HTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
let currentUser = null;
let token = localStorage.getItem('token');
let allFetchedInternships = []; // A cache for all internships to avoid re-fetching
let studentApplications = []; // A cache for the student's application IDs

// --- MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // This is the main entry point for the app.
    // It runs once the entire HTML page is loaded.
    
    // 1. Set up all event listeners
    setupEventListeners();

    // 2. Check if the user is already logged in from a previous session
    checkLoginStatus();
});

// Add this new function in js/app.js

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    
    // Create the new notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; // e.g., "notification success"
    notification.textContent = message;

    // Add it to the container
    container.appendChild(notification);

    // Automatically remove the element after the animation (4 seconds)
    setTimeout(() => {
        notification.remove();
    }, 4000);
}
// Add these new helper functions in js/app.js

function showInputError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    const formGroup = inputElement.parentElement; // The div containing the label and input

    // Add red border to the input
    inputElement.classList.add('is-invalid');

    // Create and add the error message paragraph
    const error = document.createElement('p');
    error.className = 'error-message';
    error.textContent = message;
    
    // Insert the error message after the input element
    formGroup.appendChild(error);
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    
    // Remove all previous error messages
    form.querySelectorAll('.error-message').forEach(error => error.remove());
    
    // Remove all previous invalid borders
    form.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
}

function setupEventListeners() {
    // Burger Menu
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);

    if (burger && nav && navLinks) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('nav-active');
            burger.classList.toggle('toggle-burger');

            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
        });
    }

    // Forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const postInternshipForm = document.getElementById('post-internship-form');
    if (postInternshipForm) postInternshipForm.addEventListener('submit', handlePostInternship);

    // Other UI elements
    const registerRoleSelect = document.getElementById('register-role');
    if (registerRoleSelect) registerRoleSelect.addEventListener('change', toggleCompanyNameField);
}

async function checkLoginStatus() {
    token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentUser = await response.json();
                if (currentUser.role === 'student') {
                    // Pre-fetch the student's applications so we know which jobs they've applied to
                    await fetchStudentApplications();
                }
            } else {
                // Token is invalid or expired
                logout(false); // Logout without showing an showNotification
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            logout(false);
        }
    }
    updateNav();
    showSection('home-section');
    loadInternships(); // This will also load featured internships
}

// --- AUTHENTICATION FUNCTIONS ---
// Replace the old handleRegister function in js/app.js

async function handleRegister(event) {
    event.preventDefault();
    clearFormErrors('register-form'); // Clear previous errors first

    // --- NEW VALIDATION LOGIC ---
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const companyName = document.getElementById('register-company-name').value;

    let isValid = true;
    if (name.trim() === '') {
        showInputError('register-name', 'Full Name is required.');
        isValid = false;
    }
    if (email.trim() === '') {
        showInputError('register-email', 'Email is required.');
        isValid = false;
    }
    if (password.trim() === '') {
        showInputError('register-password', 'Password is required.');
        isValid = false;
    } else if (password.length < 6) {
        showInputError('register-password', 'Password must be at least 6 characters.');
        isValid = false;
    }
    if (role === 'employer' && companyName.trim() === '') {
        showInputError('register-company-name', 'Company Name is required for employers.');
        isValid = false;
    }

    if (!isValid) {
        return; // Stop the function if validation fails
    }
    // --- END OF VALIDATION LOGIC ---

    const body = { name, email, password, role };
    if (role === 'employer') {
        body.companyName = companyName;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        
        const data = await response.json();
        if (!response.ok) {
            // This now handles server-side errors, like "User already exists"
            showNotification(data.errors ? data.errors.map(e => e.msg).join('\n') : (data.msg || 'Registration failed'), 'error');
            return;
        }
        
        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = data.user;
        
        showNotification('Registration successful! You are now logged in.', 'success');
        document.getElementById('register-form').reset();
        
        updateNav();
        showSection('home-section');
        loadInternships();

    } catch (error) {
        console.error('CRITICAL FETCH ERROR in handleRegister:', error);
        showNotification('A critical error occurred. Please check the console.', 'error');
    }
}

// js/app.js

// Replace the old handleLogin function in js/app.js

async function handleLogin(event) {
    event.preventDefault();
    clearFormErrors('login-form'); // Clear previous errors

    // --- NEW VALIDATION LOGIC ---
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    let isValid = true;
    if (email.trim() === '') {
        showInputError('login-email', 'Email is required.');
        isValid = false;
    }
    if (password.trim() === '') {
        showInputError('login-password', 'Password is required.');
        isValid = false;
    }

    if (!isValid) {
        return; // Stop if validation fails
    }
    // --- END OF VALIDATION LOGIC ---

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            // This handles server-side errors, like "Invalid Credentials"
            showNotification(data.errors ? data.errors.map(e => e.msg).join('\n') : 'Login failed', 'error');
            return;
        }
        
        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = data.user;

        if (currentUser.role === 'student') {
            await fetchStudentApplications();
        }
        
        showNotification('Login successful!', 'success');
        document.getElementById('login-form').reset();
        
        updateNav();

        if (currentUser.role === 'employer') {
            loadEmployerDashboard();
        } else {
            showSection('home-section');
            loadInternships();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check console.', 'error');
    }
}

// --- UI & NAVIGATION FUNCTIONS ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    const activeSection = document.getElementById(sectionId);
    if(activeSection) {
        activeSection.classList.remove('hidden');
    }
}

function updateNav() {
    const navProfile = document.getElementById('nav-profile');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navStudentDashboard = document.getElementById('nav-student-dashboard');
    const navEmployerDashboard = document.getElementById('nav-employer-dashboard');
    const navPostInternship = document.getElementById('nav-post-internship');
    const navLogout = document.getElementById('nav-logout');
    

    if (currentUser && token) {
        navProfile.classList.remove('hidden');  
        navLogin.classList.add('hidden');
        navRegister.classList.add('hidden');
        navLogout.classList.remove('hidden');

        if (currentUser.role === 'student') {
            navStudentDashboard.classList.remove('hidden');
            navEmployerDashboard.classList.add('hidden');
            navPostInternship.classList.add('hidden');
        } else if (currentUser.role === 'employer') {
            navStudentDashboard.classList.add('hidden');
            navEmployerDashboard.classList.remove('hidden');
            navPostInternship.classList.remove('hidden');
            
            const postCompanyInput = document.getElementById('post-company');
            if (postCompanyInput) {
                postCompanyInput.value = currentUser.companyName || '';
            }
        }
    } else { // No user is logged in
        navProfile.classList.add('hidden');
        navLogin.classList.remove('hidden');
        navRegister.classList.remove('hidden');
        navLogout.classList.add('hidden');
        navStudentDashboard.classList.add('hidden');
        navEmployerDashboard.classList.add('hidden');
        navPostInternship.classList.add('hidden');
    }
}
// Add these three new functions to js/app.js

async function loadProfilePage() {
    if (!currentUser) {
        showNotification("You must be logged in to view your profile.", "error");
        showSection('login-section');
        return;
    }

    showSection('profile-section');
    clearFormErrors('profile-form');

    // Populate the form with the user's current data from the currentUser object
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';

    const employerFields = document.getElementById('employer-profile-fields');
    const studentFields = document.getElementById('student-profile-fields');

    if (currentUser.role === 'employer') {
        employerFields.classList.remove('hidden');
        studentFields.classList.add('hidden');
        document.getElementById('profile-company-website').value = currentUser.companyWebsite || '';
        document.getElementById('profile-company-description').value = currentUser.companyDescription || '';
    } else if (currentUser.role === 'student') {
        studentFields.classList.remove('hidden');
        employerFields.classList.add('hidden');
        document.getElementById('profile-skills').value = (currentUser.skills || []).join(', ');
        document.getElementById('profile-education').value = currentUser.education || '';
        document.getElementById('profile-resume-link').value = currentUser.resumeLink || '';
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    if (!token) return;

    clearFormErrors('profile-form');
    
    // Collect data from the form
    const profileData = {
        name: document.getElementById('profile-name').value
    };

    if (currentUser.role === 'employer') {
        profileData.companyWebsite = document.getElementById('profile-company-website').value;
        profileData.companyDescription = document.getElementById('profile-company-description').value;
    } else if (currentUser.role === 'student') {
        profileData.skills = document.getElementById('profile-skills').value;
        profileData.education = document.getElementById('profile-education').value;
        profileData.resumeLink = document.getElementById('profile-resume-link').value;
    }

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const updatedUser = await response.json();
        
        if (!response.ok) {
            showNotification(updatedUser.msg || 'Failed to update profile.', 'error');
            return;
        }

        // IMPORTANT: Update the global currentUser object with the new data
        currentUser = updatedUser;

        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred while updating your profile.', 'error');
    }
}

function toggleCompanyNameField() {
    const role = document.getElementById('register-role').value;
    const companyField = document.getElementById('company-name-field');
    const companyInput = document.getElementById('register-company-name');

    if (role === 'employer') {
        companyField.classList.remove('hidden');
        companyInput.required = true;
    } else {
        companyField.classList.add('hidden');
        companyInput.required = false;
    }
}

// --- INTERNSHIP FUNCTIONS ---
// Replace the old loadInternships function in js/app.js

async function loadInternships(filters = {}) {
    const container = document.getElementById('all-internships');
    const featuredContainer = document.getElementById('featured-internships');
    
    // 1. Show spinner immediately
    container.innerHTML = SPINNER_HTML;
    featuredContainer.innerHTML = SPINNER_HTML;

    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/internships?${queryParams}`);
        const internships = await response.json();
        
        allFetchedInternships = internships; // Update our cache

        // 3. Clear containers before adding new content
        container.innerHTML = ''; 
        featuredContainer.innerHTML = '';

        if (internships.length === 0) {
            container.innerHTML = '<p>No internships found matching your criteria.</p>';
            featuredContainer.innerHTML = '<p>No internships are available right now.</p>';
            return;
        }

        // Populate all internships
        internships.forEach(internship => {
            container.appendChild(createInternshipCard(internship));
        });

        // Populate featured internships (first 3)
        internships.slice(0, 3).forEach(internship => {
            featuredContainer.appendChild(createInternshipCard(internship));
        });

    } catch (error) {
        console.error('Error fetching internships:', error);
        // 3. Show error message if fetch fails
        container.innerHTML = '<p>Error loading internships. Please try again later.</p>';
        featuredContainer.innerHTML = '<p>Error loading internships.</p>';
    }
}

function createInternshipCard(internship, forEmployerDashboard = false) {
    const card = document.createElement('div');
    card.className = 'internship-card';
    card.innerHTML = `
        <h3>${internship.title}</h3>
        <p class="company">Company: ${internship.companyName}</p>
        <p class="location">Location: ${internship.location}</p>
        <p class="stipend">Stipend: ${internship.stipend}</p>
        <button class="view-details-button" onclick="viewInternshipDetail('${internship._id}')">View Details</button>
    `;

    // Student view: Show "Apply" or "Applied" button
    if (currentUser && currentUser.role === 'student' && !forEmployerDashboard) {
        if (studentApplications.includes(internship._id)) {
            const appliedText = document.createElement('p');
            appliedText.textContent = "Applied";
            appliedText.style.cssText = "color: green; font-weight: bold; margin-top: 10px;";
            card.appendChild(appliedText);
        } else {
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-button';
            applyButton.textContent = 'Apply Now';
            applyButton.onclick = () => applyForInternship(internship._id);
            card.appendChild(applyButton);
        }
    }

    // Employer dashboard view: Show "Edit" and "Delete" buttons
    // ... inside createInternshipCard ...
    // Employer dashboard view: Show "Edit" and "Delete" buttons
    if (forEmployerDashboard) {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        // editButton.onclick = () => editInternship(internship._id); // Not implemented yet
        card.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        
        // THIS IS THE CHANGE
        deleteButton.onclick = () => deleteInternship(internship._id); 
        
        card.appendChild(deleteButton);
    }
//...
    return card;
}

async function viewInternshipDetail(internshipId) {
    const internship = allFetchedInternships.find(i => i._id === internshipId);
    if (!internship) {
        showNotification('Could not find internship details.');
        return;
    }

    const detailContent = document.getElementById('internship-detail-content');
    detailContent.innerHTML = `
        <h3>${internship.title}</h3>
        <p><strong>Company:</strong> ${internship.companyName}</p>
        <p><strong>Location:</strong> ${internship.location}</p>
        <p><strong>Category:</strong> ${internship.category}</p>
        <p><strong>Duration:</strong> ${internship.duration}</p>
        <p><strong>Stipend:</strong> ${internship.stipend}</p>
        <p><strong>Description:</strong></p>
        <p>${internship.description}</p>
        <p><strong>Required Skills:</strong> ${internship.skills.join(', ')}</p>
    `;
    showSection('internship-detail-section');
}

function searchInternships() {
    const keyword = document.getElementById('search-input').value;
    showSection('internships-section');
    loadInternships({ keyword });
}

function filterAndLoadInternships() {
    const category = document.getElementById('filter-category').value;
    const location = document.getElementById('filter-location').value;
    const filters = {};
    if (category) filters.category = category;
    if (location) filters.location = location;
    loadInternships(filters);
}

async function handlePostInternship(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'employer' || !token) {
        showNotification('Only logged-in employers can post internships.');
        return;
    }

    const internshipData = {
        title: document.getElementById('post-title').value,
        category: document.getElementById('post-category').value,
        location: document.getElementById('post-location').value,
        stipend: document.getElementById('post-stipend').value,
        duration: document.getElementById('post-duration').value,
        description: document.getElementById('post-description').value,
        skills: document.getElementById('post-skills').value.split(',').map(s => s.trim()),
    };

    try {
        const response = await fetch(`${API_URL}/internships`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(internshipData),
        });
        const data = await response.json();
        if (!response.ok) {
            showNotification(data.errors ? data.errors.map(e => e.msg).join('\n') : 'Failed to post internship');
            return;
        }
        showNotification('Internship posted successfully!');
        document.getElementById('post-internship-form').reset();
        loadEmployerDashboard();
    } catch (error) {
        console.error('Error posting internship:', error);
    }
}

// --- APPLICATION FUNCTIONS ---
async function fetchStudentApplications() {
    // This function gets the IDs of all internships the student has applied to
    if (!currentUser || currentUser.role !== 'student' || !token) return;
    try {
        const response = await fetch(`${API_URL}/applications/student/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const applications = await response.json();
            // We only need the internship ID for checking if a job has been applied to
            studentApplications = applications.map(app => app.internship._id);
        }
    } catch (error) {
        console.error('Could not fetch student applications:', error);
    }
}

async function applyForInternship(internshipId) {
    if (!currentUser || currentUser.role !== 'student' || !token) {
        showNotification('Please login as a student to apply.');
        showSection('login-section');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/applications/internship/${internshipId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            showNotification(data.msg || 'Failed to apply.');
            return;
        }
        showNotification('Application submitted successfully!');
        
        // Add this internship to our cache of applied jobs and re-render
        studentApplications.push(internshipId);
        loadInternships(); // This will re-render all cards with the updated "Applied" status

    } catch (error) {
        console.error('Error applying for internship:', error);
    }
}

// --- DASHBOARD FUNCTIONS ---
// Replace the old loadStudentDashboard function in js/app.js

async function loadStudentDashboard() {
    showSection('student-dashboard-section');
    const container = document.getElementById('student-applications');
    
    // 1. Show spinner immediately
    container.innerHTML = SPINNER_HTML;

    if (!currentUser || currentUser.role !== 'student' || !token) {
        container.innerHTML = '<p>You must be logged in as a student to view this page.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/applications/student/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const applications = await response.json();
        
        // 3. Clear container
        container.innerHTML = '';
        if (applications.length === 0) {
            container.innerHTML = '<p>You have not applied for any internships yet.</p>';
            return;
        }

        applications.forEach(app => {
            const appCard = document.createElement('div');
            appCard.className = 'internship-card';
            appCard.innerHTML = `
                <h3>${app.internship.title}</h3>
                <p class="company">${app.internship.companyName}</p>
                <p>Status: <strong class="status-${app.status.replace(/\s+/g, '-').toLowerCase()}">${app.status}</strong></p>
                <p>Applied On: ${new Date(app.appliedDate).toLocaleDateString()}</p>
            `;
            container.appendChild(appCard);
        });

    } catch (error) {
        console.error('Error loading student dashboard:', error);
        // 3. Show error message
        container.innerHTML = '<p>Could not load your applications.</p>';
    }
}

// Replace the old loadEmployerDashboard function in js/app.js

async function loadEmployerDashboard() {
    showSection('employer-dashboard-section');
    const postedContainer = document.getElementById('employer-posted-internships');
    const receivedContainer = document.getElementById('employer-received-applications');
    
    // 1. Show spinner immediately
    postedContainer.innerHTML = SPINNER_HTML;
    receivedContainer.innerHTML = ''; // Clear previous applications

    if (!currentUser || currentUser.role !== 'employer' || !token) {
        postedContainer.innerHTML = '<p>You must be logged in as an employer to view this page.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/internships/employer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const myInternships = await response.json();
        
        // 3. Clear container
        postedContainer.innerHTML = '';
        if (myInternships.length === 0) {
            postedContainer.innerHTML = '<p>You have not posted any internships yet.</p>';
            return;
        }

        myInternships.forEach(internship => {
            postedContainer.appendChild(createInternshipCard(internship, true));
            // Now fetch applications for this internship
            loadApplicationsForInternship(internship._id, receivedContainer);
        });

    } catch (error) {
        console.error('Error loading employer dashboard:', error);
        // 3. Show error message
        postedContainer.innerHTML = '<p>Could not load your internships.</p>';
    }
}

async function loadApplicationsForInternship(internshipId, container) {
    try {
        const response = await fetch(`${API_URL}/applications/internship/${internshipId}/employer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const applications = await response.json();
        
        if (applications.length > 0) {
            const internship = allFetchedInternships.find(i => i._id === internshipId) || applications[0].internship;
            const internshipTitle = internship ? internship.title : 'Internship';
            
            const title = document.createElement('h4');
            title.textContent = `Applications for "${internshipTitle}"`;
            title.style.marginTop = '20px';
            container.appendChild(title);

            const list = document.createElement('ul');
            list.style.listStyle = 'none';
            applications.forEach(app => {
                const listItem = document.createElement('li');
                // Use innerHTML to easily add styled elements and buttons
                listItem.innerHTML = `
                    <span>${app.studentName} (${app.studentEmail}) - 
                        Status: <strong class="status-${app.status.replace(/\s+/g, '-').toLowerCase()}">${app.status}</strong>
                    </span>
                    <div class="application-actions">
                        <button class="action-button shortlist" onclick="updateApplicationStatus('${app._id}', 'Shortlisted')">Shortlist</button>
                        <button class="action-button reject" onclick="updateApplicationStatus('${app._id}', 'Rejected')">Reject</button>
                    </div>
                `;
                listItem.className = 'application-item';
                list.appendChild(listItem);
            });
            container.appendChild(list);
        }
    } catch(error) {
        console.error(`Error loading applications for internship ${internshipId}:`, error);
    }
}
// Add this new function in js/app.js

async function deleteInternship(internshipId) {
    // 1. Ask for confirmation before deleting
    if (!confirm('Are you sure you want to permanently delete this internship? This action cannot be undone.')) {
        return; // Stop if the user clicks "Cancel"
    }

    // 2. Check if the user is an authorized employer
    if (!currentUser || currentUser.role !== 'employer' || !token) {
        showNotification('You are not authorized to perform this action.');
        return;
    }

    try {
        // 3. Make the API call to the backend
        const response = await fetch(`${API_URL}/internships/${internshipId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        // 4. Handle the response
        if (!response.ok) {
            showNotification(data.msg || 'Failed to delete internship.');
            throw new Error(data.msg || 'Deletion failed');
        }

        // 5. Success! Show a message and refresh the dashboard
        showNotification('Internship deleted successfully.');
        loadEmployerDashboard(); // Reload the dashboard to show the updated list

    } catch (error) {
        console.error('Error deleting internship:', error);
        showNotification('An error occurred while deleting the internship.');
    }
}
// Add this new function in js/app.js

async function updateApplicationStatus(applicationId, newStatus) {
    // 1. Check for authorization
    if (!currentUser || currentUser.role !== 'employer' || !token) {
        showNotification('You are not authorized to perform this action.');
        return;
    }

    try {
        // 2. Make the API call to the backend to update the status
        const response = await fetch(`${API_URL}/applications/${applicationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus }) // Send the new status in the body
        });

        const data = await response.json();

        // 3. Handle the response
        if (!response.ok) {
            showNotification(data.msg || 'Failed to update application status.');
            throw new Error(data.msg || 'Status update failed');
        }

        // 4. Success! Refresh the dashboard to show the change
        // We don't need an showNotification here, the UI update is enough feedback.
        loadEmployerDashboard();

    } catch (error) {
        console.error('Error updating application status:', error);
        showNotification('An error occurred while updating the status.');
    }
}