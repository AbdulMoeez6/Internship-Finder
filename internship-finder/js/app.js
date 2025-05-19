const API_URL = 'http://localhost:5000/api'; // Your backend URL
let currentUser = null; // Store logged-in user object
let token = localStorage.getItem('token'); // Store JWT

document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    initApp();
    loadInternships(); // Load internships on home page and internships page
    updateNav();

    // Event Listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('post-internship-form').addEventListener('submit', handlePostInternship);
    document.getElementById('register-role').addEventListener('change', toggleCompanyNameField);

    // Burger menu for mobile
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        // Burger Animation
        burger.classList.toggle('toggle-burger');
    });
});

// --- Global State (simulating a backend with LocalStorage) ---
let users = JSON.parse(localStorage.getItem('users')) || [];
let internships = JSON.parse(localStorage.getItem('internships')) || [
    // Sample Data
    { id: 1, title: "Frontend Developer Intern", company: "Tech Solutions Inc.", category: "IT", location: "New York", stipend: "$1000/month", duration: "3 months", description: "Work on exciting frontend projects using React.", skills: "HTML, CSS, JavaScript, React", employerEmail: "employer1@example.com", applications: [] },
    { id: 2, title: "Marketing Intern", company: "Creative Minds Agency", category: "Marketing", location: "Remote", stipend: "Unpaid", duration: "2 months", description: "Assist with social media campaigns and content creation.", skills: "Social Media, Content Writing", employerEmail: "employer2@example.com", applications: [] },
    { id: 3, title: "Data Analyst Intern", company: "DataDriven Co.", category: "IT", location: "San Francisco", stipend: "$1200/month", duration: "4 months", description: "Analyze datasets and generate reports.", skills: "SQL, Python, Excel", employerEmail: "employer1@example.com", applications: [] }
];
let applications = JSON.parse(localStorage.getItem('applications')) || []; // {internshipId, studentEmail, studentName, status: 'Applied'}

function saveData() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('internships', JSON.stringify(internships));
    localStorage.setItem('applications', JSON.stringify(applications));
}

function initApp() {
    // Show home section by default
    showSection('home-section');
    loadFeaturedInternships();
}

// --- Navigation & Section Handling ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    updateNavActiveState(sectionId);
}

function updateNavActiveState(activeSectionId) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active-nav');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`showSection('${activeSectionId}')`)) {
            link.classList.add('active-nav');
        }
    });
}

function updateNav() {
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navStudentDashboard = document.getElementById('nav-student-dashboard');
    const navEmployerDashboard = document.getElementById('nav-employer-dashboard');
    const navPostInternship = document.getElementById('nav-post-internship');
    const navLogout = document.getElementById('nav-logout');

    if (currentUser) {
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
            // Pre-fill company name in post internship form
            const postCompanyInput = document.getElementById('post-company');
            if(postCompanyInput) postCompanyInput.value = currentUser.companyName || '';
        }
    } else {
        navLogin.classList.remove('hidden');
        navRegister.classList.remove('hidden');
        navLogout.classList.add('hidden');
        navStudentDashboard.classList.add('hidden');
        navEmployerDashboard.classList.add('hidden');
        navPostInternship.classList.add('hidden');
    }
}


// --- User Authentication (Simplified) ---
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = users.find(u => u.email === email && u.password === password); // In real app, hash passwords!
    if (user) {
        currentUser = user;
        saveData();
        alert('Login successful!');
        showSection('home-section');
        updateNav();
        loadFeaturedInternships();
        document.getElementById('login-form').reset();
    } else {
        alert('Invalid credentials.');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value; // In real app, hash passwords!
    const role = document.getElementById('register-role').value;
    const companyName = document.getElementById('register-company-name').value;

    if (users.find(u => u.email === email)) {
        alert('User with this email already exists.');
        return;
    }

    const newUser = { name, email, password, role };
    if (role === 'employer') {
        if (!companyName) {
            alert('Company name is required for employers.');
            return;
        }
        newUser.companyName = companyName;
    }

    users.push(newUser);
    currentUser = newUser; // Auto-login after registration
    saveData();
    alert('Registration successful! You are now logged in.');
    showSection('home-section');
    updateNav();
    loadFeaturedInternships();
    document.getElementById('register-form').reset();
    toggleCompanyNameField(); // Reset field visibility
}

function logout() {
    currentUser = null;
    saveData();
    alert('Logged out.');
    showSection('home-section');
    updateNav();
    loadFeaturedInternships();
}

function toggleCompanyNameField() {
    const role = document.getElementById('register-role').value;
    const companyField = document.getElementById('company-name-field');
    if (role === 'employer') {
        companyField.classList.remove('hidden');
        document.getElementById('register-company-name').required = true;
    } else {
        companyField.classList.add('hidden');
        document.getElementById('register-company-name').required = false;
    }
}

// --- Internship Handling ---
function createInternshipCard(internship, forEmployerDashboard = false) {
    const card = document.createElement('div');
    card.className = 'internship-card';
    card.innerHTML = `
        <h3>${internship.title}</h3>
        <p class="company">Company: ${internship.company}</p>
        <p class="location">Location: ${internship.location}</p>
        <p class="category">Category: ${internship.category}</p>
        <p class="duration">Duration: ${internship.duration}</p>
        <p class="stipend">Stipend: ${internship.stipend}</p>
        <button class="view-details-button" onclick="viewInternshipDetail(${internship.id})">View Details</button>
    `;

    if (currentUser && currentUser.role === 'student' && !forEmployerDashboard) {
        const alreadyApplied = applications.some(app => app.internshipId === internship.id && app.studentEmail === currentUser.email);
        if (alreadyApplied) {
            const appliedText = document.createElement('p');
            appliedText.textContent = "Applied";
            appliedText.style.color = "green";
            appliedText.style.fontWeight = "bold";
            card.appendChild(appliedText);
        } else {
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-button';
            applyButton.textContent = 'Apply Now';
            applyButton.onclick = () => applyForInternship(internship.id);
            card.appendChild(applyButton);
        }
    }

    if (forEmployerDashboard && currentUser && currentUser.role === 'employer' && internship.employerEmail === currentUser.email) {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        editButton.onclick = () => editInternship(internship.id); // Implement editInternship
        card.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteInternship(internship.id);
        card.appendChild(deleteButton);
    }
    return card;
}

function loadInternships(filteredInternships = internships) {
    const container = document.getElementById('all-internships');
    container.innerHTML = ''; // Clear previous
    if (filteredInternships.length === 0) {
        container.innerHTML = '<p>No internships found matching your criteria.</p>';
        return;
    }
    filteredInternships.forEach(internship => {
        container.appendChild(createInternshipCard(internship));
    });
}

function loadFeaturedInternships() {
    const container = document.getElementById('featured-internships');
    container.innerHTML = '';
    const featured = internships.slice(0, 3); // Show first 3 as featured
    if (featured.length === 0) {
        container.innerHTML = '<p>No featured internships available right now.</p>';
        return;
    }
    featured.forEach(internship => {
        container.appendChild(createInternshipCard(internship));
    });
}

function searchInternships() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = internships.filter(internship =>
        internship.title.toLowerCase().includes(searchTerm) ||
        internship.company.toLowerCase().includes(searchTerm) ||
        internship.category.toLowerCase().includes(searchTerm) ||
        internship.location.toLowerCase().includes(searchTerm) ||
        internship.skills.toLowerCase().includes(searchTerm)
    );
    showSection('internships-section');
    loadInternships(filtered);
}

function filterAndLoadInternships() {
    const category = document.getElementById('filter-category').value;
    const location = document.getElementById('filter-location').value;
    let filtered = internships;

    if (category) {
        filtered = filtered.filter(i => i.category === category);
    }
    if (location) {
        filtered = filtered.filter(i => i.location.toLowerCase().includes(location.toLowerCase()));
    }
    loadInternships(filtered);
}


function viewInternshipDetail(internshipId) {
    const internship = internships.find(i => i.id === internshipId);
    if (!internship) return;

    const detailContent = document.getElementById('internship-detail-content');
    detailContent.innerHTML = `
        <h3>${internship.title}</h3>
        <p><strong>Company:</strong> ${internship.company}</p>
        <p><strong>Location:</strong> ${internship.location}</p>
        <p><strong>Category:</strong> ${internship.category}</p>
        <p><strong>Duration:</strong> ${internship.duration}</p>
        <p><strong>Stipend:</strong> ${internship.stipend}</p>
        <p><strong>Description:</strong> ${internship.description}</p>
        <p><strong>Required Skills:</strong> ${internship.skills}</p>
    `;

    if (currentUser && currentUser.role === 'student') {
        const alreadyApplied = applications.some(app => app.internshipId === internship.id && app.studentEmail === currentUser.email);
        if (alreadyApplied) {
            const appliedText = document.createElement('p');
            appliedText.textContent = "You have already applied for this internship.";
            appliedText.style.color = "green";
            appliedText.style.fontWeight = "bold";
            detailContent.appendChild(appliedText);
        } else {
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-button';
            applyButton.textContent = 'Apply Now';
            applyButton.style.marginTop = '15px';
            applyButton.onclick = () => applyForInternship(internship.id, true);
            detailContent.appendChild(applyButton);
        }
    }
    showSection('internship-detail-section');
}

function applyForInternship(internshipId, fromDetailPage = false) {
    if (!currentUser || currentUser.role !== 'student') {
        alert('Please login as a student to apply.');
        showSection('login-section');
        return;
    }

    if (applications.some(app => app.internshipId === internshipId && app.studentEmail === currentUser.email)) {
        alert('You have already applied for this internship.');
        return;
    }

    // Simple application: just record it. In a real app, you'd have a form.
    const newApplication = {
        id: applications.length + 1,
        internshipId: internshipId,
        studentEmail: currentUser.email,
        studentName: currentUser.name,
        status: 'Applied',
        appliedDate: new Date().toLocaleDateString()
    };
    applications.push(newApplication);

    // Also add to the internship object's applications (for employer view)
    const internship = internships.find(i => i.id === internshipId);
    if(internship) {
        if(!internship.applications) internship.applications = [];
        internship.applications.push({studentEmail: currentUser.email, studentName: currentUser.name, status: 'Applied'});
    }

    saveData();
    alert('Application submitted successfully!');
    if (fromDetailPage) {
        viewInternshipDetail(internshipId); // Refresh detail page to show "Applied"
    } else {
        loadInternships(); // Refresh the list view
        loadFeaturedInternships();
    }
    loadStudentDashboard(); // Refresh dashboard if visible
}


// --- Student Dashboard ---
function loadStudentDashboard() {
    if (!currentUser || currentUser.role !== 'student') {
        showSection('login-section');
        return;
    }
    const container = document.getElementById('student-applications');
    container.innerHTML = '';
    const myApplications = applications.filter(app => app.studentEmail === currentUser.email);

    if (myApplications.length === 0) {
        container.innerHTML = '<p>You have not applied for any internships yet.</p>';
        return;
    }

    myApplications.forEach(app => {
        const internship = internships.find(i => i.id === app.internshipId);
        if (internship) {
            const appCard = document.createElement('div');
            appCard.className = 'internship-card'; // Reuse styling
            appCard.innerHTML = `
                <h3>${internship.title}</h3>
                <p class="company">${internship.company}</p>
                <p>Status: <strong style="color: ${app.status === 'Viewed' ? 'blue' : 'green'};">${app.status}</strong></p>
                <p>Applied On: ${app.appliedDate}</p>
                <button class="view-details-button" onclick="viewInternshipDetail(${internship.id})">View Original Listing</button>
            `;
            container.appendChild(appCard);
        }
    });
}

// --- Employer Dashboard ---
function handlePostInternship(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'employer') {
        alert('Only employers can post internships.');
        return;
    }

    const newInternship = {
        id: internships.length > 0 ? Math.max(...internships.map(i => i.id)) + 1 : 1,
        title: document.getElementById('post-title').value,
        company: currentUser.companyName, // From logged-in employer
        category: document.getElementById('post-category').value,
        location: document.getElementById('post-location').value,
        stipend: document.getElementById('post-stipend').value,
        duration: document.getElementById('post-duration').value,
        description: document.getElementById('post-description').value,
        skills: document.getElementById('post-skills').value,
        employerEmail: currentUser.email,
        applications: []
    };

    internships.push(newInternship);
    saveData();
    alert('Internship posted successfully!');
    document.getElementById('post-internship-form').reset();
    loadEmployerDashboard();
    showSection('employer-dashboard-section');
    loadInternships(); // Refresh general listings
    loadFeaturedInternships();
}

function loadEmployerDashboard() {
    if (!currentUser || currentUser.role !== 'employer') {
        showSection('login-section');
        return;
    }

    // Load posted internships
    const postedContainer = document.getElementById('employer-posted-internships');
    postedContainer.innerHTML = '';
    const myInternships = internships.filter(i => i.employerEmail === currentUser.email);

    if (myInternships.length === 0) {
        postedContainer.innerHTML = '<p>You have not posted any internships yet.</p>';
    } else {
        myInternships.forEach(internship => {
            postedContainer.appendChild(createInternshipCard(internship, true)); // Pass true for employer view
        });
    }

    // Load received applications
    const receivedAppsContainer = document.getElementById('employer-received-applications');
    receivedAppsContainer.innerHTML = '<h4>Applications for My Internships:</h4>';
    let hasApplications = false;

    myInternships.forEach(internship => {
        const internshipApplications = applications.filter(app => app.internshipId === internship.id);
        if (internshipApplications.length > 0) {
            hasApplications = true;
            const internshipAppHeader = document.createElement('h5');
            internshipAppHeader.textContent = `Applicants for "${internship.title}":`;
            internshipAppHeader.style.marginTop = '10px';
            receivedAppsContainer.appendChild(internshipAppHeader);

            const ul = document.createElement('ul');
            internshipApplications.forEach(app => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${app.studentName} (${app.studentEmail}) - Applied on ${app.appliedDate}
                    - Status: <span id="app-status-${app.id}">${app.status}</span>
                    <button onclick="markApplicationViewed(${app.id}, ${internship.id})">Mark as Viewed</button>
                `; // Add more actions like shortlist/reject later
                ul.appendChild(li);
            });
            receivedAppsContainer.appendChild(ul);
        }
    });

    if (!hasApplications) {
        receivedAppsContainer.innerHTML += '<p>No applications received yet for your internships.</p>';
    }
}

function markApplicationViewed(applicationId, internshipId) {
    const application = applications.find(app => app.id === applicationId);
    const internship = internships.find(i => i.id === internshipId);

    if (application) {
        application.status = 'Viewed by Employer';
        // Update status in internship.applications too
        if (internship && internship.applications) {
            const appInInternship = internship.applications.find(a => a.studentEmail === application.studentEmail);
            if (appInInternship) appInInternship.status = 'Viewed by Employer';
        }
        saveData();
        loadEmployerDashboard(); // Refresh view
        alert(`Application from ${application.studentName} marked as viewed.`);
    }
}

function deleteInternship(internshipId) {
    if (!currentUser || currentUser.role !== 'employer') return;
    if (!confirm('Are you sure you want to delete this internship? This action cannot be undone.')) return;

    internships = internships.filter(i => i.id !== internshipId || i.employerEmail !== currentUser.email);
    // Also remove associated applications (optional, or mark them as 'listing removed')
    applications = applications.filter(app => app.internshipId !== internshipId);

    saveData();
    loadEmployerDashboard();
    loadInternships();
    loadFeaturedInternships();
    alert('Internship deleted.');
}

function editInternship(internshipId) {
    if (!currentUser || currentUser.role !== 'employer') return;
    const internship = internships.find(i => i.id === internshipId && i.employerEmail === currentUser.email);
    if (!internship) return;

    // Pre-fill the post-internship form with existing data
    document.getElementById('post-title').value = internship.title;
    document.getElementById('post-company').value = internship.company; // Should be auto-filled and disabled
    document.getElementById('post-category').value = internship.category;
    document.getElementById('post-location').value = internship.location;
    document.getElementById('post-stipend').value = internship.stipend;
    document.getElementById('post-duration').value = internship.duration;
    document.getElementById('post-description').value = internship.description;
    document.getElementById('post-skills').value = internship.skills;

    // Change form submission to handle update
    const form = document.getElementById('post-internship-form');
    form.onsubmit = (event) => handleUpdateInternship(event, internshipId);
    form.querySelector('button[type="submit"]').textContent = 'Update Internship';

    showSection('post-internship-section');
    alert("Editing internship. Make your changes and click 'Update Internship'. To cancel, navigate away.");
}

function handleUpdateInternship(event, internshipId) {
    event.preventDefault();
    const internshipIndex = internships.findIndex(i => i.id === internshipId && i.employerEmail === currentUser.email);
    if (internshipIndex === -1) {
        alert("Error: Internship not found or you don't have permission.");
        resetPostInternshipForm();
        return;
    }

    internships[internshipIndex] = {
        ...internships[internshipIndex], // Keep original ID, employerEmail, applications
        title: document.getElementById('post-title').value,
        // company: document.getElementById('post-company').value, // Company name shouldn't change or comes from profile
        category: document.getElementById('post-category').value,
        location: document.getElementById('post-location').value,
        stipend: document.getElementById('post-stipend').value,
        duration: document.getElementById('post-duration').value,
        description: document.getElementById('post-description').value,
        skills: document.getElementById('post-skills').value,
    };

    saveData();
    alert('Internship updated successfully!');
    resetPostInternshipForm();
    loadEmployerDashboard();
    showSection('employer-dashboard-section');
    loadInternships();
    loadFeaturedInternships();
}

function resetPostInternshipForm() {
    const form = document.getElementById('post-internship-form');
    form.reset();
    form.onsubmit = handlePostInternship; // Reset to default submit handler
    form.querySelector('button[type="submit"]').textContent = 'Post Internship';
    if(currentUser && currentUser.role === 'employer' && document.getElementById('post-company')) {
        document.getElementById('post-company').value = currentUser.companyName;
    }
}

// Login
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.errors ? data.errors.map(e => e.msg).join('\n') : 'Login failed');
            throw new Error(data.msg || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = data.user; // Save user object from response
        alert('Login successful!');
        showSection('home-section');
        updateNav();
        loadFeaturedInternships(); // Or other relevant data
        document.getElementById('login-form').reset();
    } catch (error) {
        console.error('Login error:', error);
        // alert('Login failed. Please check console.'); // User-friendly message handled above
    }
}

// Register
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const companyName = document.getElementById('register-company-name').value;

    const body = { name, email, password, role };
    if (role === 'employer' && companyName) {
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
             alert(data.errors ? data.errors.map(e => e.msg).join('\n') : 'Registration failed');
            throw new Error(data.msg || 'Registration failed');
        }
        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = data.user;
        alert('Registration successful! You are now logged in.');
        // ... rest of UI updates
        showSection('home-section');
        updateNav();
        loadFeaturedInternships();
        document.getElementById('register-form').reset();

    } catch (error) {
        console.error('Registration error:', error);
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    alert('Logged out.');
    showSection('home-section');
    updateNav();
    loadFeaturedInternships();
}

// Check Logged-in Status 
async function checkLoginStatus() {
    if (token) {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentUser = await response.json();
            } else {
                localStorage.removeItem('token'); // Invalid token
                token = null;
                currentUser = null;
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            localStorage.removeItem('token');
            token = null;
            currentUser = null;
        }
    }
    updateNav(); // Update nav based on currentUser
    loadFeaturedInternships(); // Or initApp()
    loadInternships(); // Initial load
}
// Call this in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    // ... other initializations
});

// Internship Functions:
// Fetch Internships:

async function loadInternships(filters = {}) {
    const container = document.getElementById('all-internships');
    container.innerHTML = '<p>Loading internships...</p>';
    try {
        // Construct query string from filters:
        // e.g., ?category=IT&location=Remote&keyword=developer
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/internships?${queryParams}`);
        const internships = await response.json();

        container.innerHTML = ''; // Clear
        if (internships.length === 0) {
            container.innerHTML = '<p>No internships found.</p>';
            return;
        }
        internships.forEach(internship => {
            // internship._id will be the ID from MongoDB
            container.appendChild(createInternshipCard(internship));
        });
    } catch (error) {
        console.error('Error fetching internships:', error);
        container.innerHTML = '<p>Error loading internships. Please try again later.</p>';
    }
}
// Modify searchInternships and filterAndLoadInternships to pass filters to loadInternships
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

// View Internship Detail: GET /internships/:id (use internship._id).
// Post Internship (Employer): POST /internships (send JWT in Authorization header).

async function handlePostInternship(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'employer' || !token) {
        alert('Only logged-in employers can post internships.');
        return;
    }

    const internshipData = {
        title: document.getElementById('post-title').value,
        // companyName will be taken from req.user on backend, or you can send it
        // companyName: currentUser.companyName,
        category: document.getElementById('post-category').value,
        location: document.getElementById('post-location').value,
        stipend: document.getElementById('post-stipend').value,
        duration: document.getElementById('post-duration').value,
        description: document.getElementById('post-description').value,
        skills: document.getElementById('post-skills').value.split(',').map(s => s.trim()), // Send as array
    };

    try {
        const response = await fetch(`${API_URL}/internships`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(internshipData),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.errors ? data.errors.map(e => e.msg).join('\n') : 'Failed to post internship');
            throw new Error(data.msg || 'Failed to post internship');
        }
        alert('Internship posted successfully!');
        document.getElementById('post-internship-form').reset();
        loadEmployerDashboard(); // Refresh
        showSection('employer-dashboard-section');
    } catch (error) {
        console.error('Error posting internship:', error);
    }
}

// Application Functions:
// Apply for Internship (Student)

async function applyForInternship(internshipId, fromDetailPage = false) {
    if (!currentUser || currentUser.role !== 'student' || !token) {
        alert('Please login as a student to apply.');
        showSection('login-section');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/applications/internship/${internshipId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' // If you send a body
            },
            // body: JSON.stringify({ additionalInfo: "..." }) // If you add more fields
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.msg || 'Failed to apply.');
            throw new Error(data.msg || 'Failed to apply');
        }
        alert('Application submitted successfully!');
        // Refresh UI:
        if (fromDetailPage) viewInternshipDetail(internshipId);
        else { loadInternships(); loadFeaturedInternships(); }
        loadStudentDashboard();
    } catch (error) {
        console.error('Error applying for internship:', error);
        // alert('Error applying. Check console.'); // User-friendly msg handled above
    }
}