/**
 * JobGraph - User Routes
 * User management and skills CRUD
 */
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser, addSkills, removeSkill, getMySkills, getAllSkills } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const { skillsValidation, removeSkillValidation } = require('../middleware/validators');

// Admin routes
router.get('/', authenticate, authorize(USER_ROLES.ADMIN), getAllUsers);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteUser);

// Skill management
router.get('/skills', authenticate, getMySkills);
router.post('/skills', authenticate, skillsValidation, addSkills);
router.delete('/skills/:skillName', authenticate, removeSkillValidation, removeSkill);

// Public skills list
router.get('/all-skills', getAllSkills);

// Get user by ID
router.get('/:id', authenticate, getUserById);

module.exports = router;
