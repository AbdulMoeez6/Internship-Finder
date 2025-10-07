# Internship Finder

A lightweight web application that connects students/freshers with internship opportunities and helps employers post internships and manage applications.

## What the website does

- Lets students browse and search internships by keyword, category, and location.
- Allows students to register, login, view their profile, and apply for internships.
- Lets employers register, post new internships, view applications for their postings, and manage application statuses (shortlist/reject).
- Provides separate dashboards for students and employers to manage applications and postings.

## Basic tech stack

- Frontend: plain HTML, CSS and JavaScript (client-side app in `internship-finder/`).
- Backend: Node.js with Express.js (API in `internship-finder-backend/`).
- Database: MongoDB (accessed via Mongoose models).
- Auth: JSON Web Tokens (JWT) for protected API routes.

## Key functionalities

- User registration and authentication (student or employer roles).
- Internship CRUD for employers (create, read, update, delete).
- Internship listing and filtering for visitors and students.
- Students can apply for internships and view their application history.
- Employers can view applications for their internships and update application status.
- Profile management for both students and employers.

## Project layout (important files)

- `internship-finder/` — Frontend (static files: `index.html`, `css/style.css`, `js/app.js`).
- `internship-finder-backend/` — Backend API (entry: `server.js`, routes in `routes/api/`, models in `models/`).

## Running locally (quick)

1. Start MongoDB and set environment variables (e.g. `JWT_SECRET`, `MONGO_URI`).
2. From `internship-finder-backend/` run `npm install` then `npm run server` to start the API.
3. Serve the frontend (open `internship-finder/index.html` in a browser or use a static server).

For more details and configuration, see the source files in the frontend and backend folders.