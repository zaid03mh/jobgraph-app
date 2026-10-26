/**
 * JobGraph - Job Routes
 * Job CRUD and filtering
 */
const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, getJobById, updateJob, deleteJob, getMyJobs } = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const { createJobValidation, updateJobValidation, jobIdValidation, jobFilterValidation } = require('../middleware/validators');

// Get recruiter's own jobs
router.get('/my-jobs', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), getMyJobs);

// Public job listing with filters
router.get('/', jobFilterValidation, getAllJobs);

// Get single job
router.get('/:id', jobIdValidation, getJobById);

// Create job (Recruiter/Admin)
router.post('/', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), createJobValidation, createJob);

// Update job (Owner/Admin)
router.put('/:id', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), updateJobValidation, updateJob);

// Delete job (Owner/Admin)
router.delete('/:id', authenticate, authorize(USER_ROLES.RECRUITER, USER_ROLES.ADMIN), jobIdValidation, deleteJob);

module.exports = router;
