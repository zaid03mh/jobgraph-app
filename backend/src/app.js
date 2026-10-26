/**
 * JobGraph - Express Application Configuration
 * Main app setup with middleware and routes
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const recommendationRoutes = require('./routes/recommendations');

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
        next();
    });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'JobGraph API is running', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'JobGraph API',
        version: '1.0.0',
        description: 'Mobile Job Recommendation System',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            jobs: '/api/jobs',
            applications: '/api/applications',
            recommendations: '/api/recommendations'
        }
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
