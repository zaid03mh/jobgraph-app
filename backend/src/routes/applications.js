/**
 * JobGraph - Application Routes
 * Job applications (POSTULE_A)
 */
const express = require('express');
const router = express.Router();
const { applyToJob, getApplicationHistory, getJobApplicants, updateApplicationStatus, withdrawApplication, checkApplicationStatus } = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const { applyJobValidation, updateApplicationStatusValidation } = require('../middleware/validators');

// Candidate routes
router.post('/:jobId', authenticate, authorize(USER_ROLES.CANDIDATE), applyJobValidation, applyToJob);
router.get('/history', authenticate, authorize(USER_ROLES.CANDIDATE), getApplicationHistory);
router.get('/check/:jobId', authenticate, checkApplicationStatus);
router.delete('/:applicationId', authenticate, authorize(USER_ROLES.CANDIDATE), withdrawApplication);

// Recruiter routes
router.get('/job/:jobId', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), getJobApplicants);
router.put('/:applicationId/status', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), updateApplicationStatusValidation, updateApplicationStatus);

module.exports = router;
