/**
 * JobGraph - Recommendation Routes
 * Skill-based job recommendations
 */
const express = require('express');
const router = express.Router();
const { getRecommendations, getJobRecommendation } = require('../controllers/recommendationController');
const { authenticate, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

// Get personalized recommendations (Candidate)
router.get('/', authenticate, authorize(USER_ROLES.CANDIDATE), getRecommendations);

// Get recommendation for specific job
router.get('/:jobId', authenticate, getJobRecommendation);

module.exports = router;
