
// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS Middleware - Allow requests from your frontend (e.g., http://localhost:3000 or your file:// URL if running locally)
app.use(cors()); // For development, you might want to restrict this in production

// Body Parser Middleware
app.use(express.json()); // To accept JSON data in req.body

// Define Routes
app.get('/', (req, res) => res.send('Internship Finder API Running'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/internships', require('./routes/api/internships'));
app.use('/api/applications', require('./routes/api/applications'));
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
