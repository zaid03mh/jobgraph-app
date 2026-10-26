/**
 * JobGraph - Application Controller
 * Handles job applications (POSTULE_A relationship).
 */

const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');
const { runQuery } = require('../config/database');
const { STATUS_CODES, ERROR_CODES, APPLICATION_STATUS, USER_ROLES, PAGINATION } = require('../config/constants');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Apply to a job (Candidate only)
const applyToJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    const jobCheck = await runQuery('MATCH (j:Job {id: $jobId}) RETURN j', { jobId }, 'READ');
    if (jobCheck.length === 0) {
        throw new ApiError(STATUS_CODES.NOT_FOUND, 'Job not found', ERROR_CODES.JOB_NOT_FOUND);
    }

    const existingApp = await runQuery(
        `MATCH (u:User {id: $userId})-[a:POSTULE_A]->(j:Job {id: $jobId}) RETURN a`,
        { userId: req.user.id, jobId }, 'READ'
    );
    if (existingApp.length > 0) {
        throw new ApiError(STATUS_CODES.CONFLICT, 'You have already applied', ERROR_CODES.APPLICATION_ALREADY_EXISTS);
    }

    const applicationId = uuidv4();
    const result = await runQuery(
        `MATCH (u:User {id: $userId}), (j:Job {id: $jobId})
         CREATE (u)-[a:POSTULE_A {id: $appId, coverLetter: $coverLetter, status: $status, appliedAt: datetime()}]->(j)
         RETURN a, j`,
        { userId: req.user.id, jobId, appId: applicationId, coverLetter: coverLetter?.trim() || '', status: APPLICATION_STATUS.PENDING }
    );

    const app = result[0].get('a').properties;
    const job = result[0].get('j').properties;

    res.status(STATUS_CODES.CREATED).json({
        status: STATUS_CODES.CREATED, message: 'Application submitted successfully',
        data: { application: { id: app.id, status: app.status, appliedAt: app.appliedAt, job: { id: job.id, title: job.title } } }
    });
});

// Get application history
const getApplicationHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const result = await runQuery(
        `MATCH (u:User {id: $userId})-[a:POSTULE_A]->(j:Job)
         OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
         WITH a, j, COLLECT(DISTINCT s.name) AS skills
         RETURN a, j, skills ORDER BY a.appliedAt DESC SKIP $skip LIMIT $limit`,
        { userId: req.user.id, skip: neo4j.int(skip), limit: neo4j.int(parseInt(limit)) }, 'READ'
    );

    const countResult = await runQuery('MATCH (u:User {id: $userId})-[a:POSTULE_A]->() RETURN COUNT(a) AS total', { userId: req.user.id }, 'READ');
    const total = countResult[0].get('total');

    const applications = result.map(r => ({
        id: r.get('a').properties.id, status: r.get('a').properties.status,
        appliedAt: r.get('a').properties.appliedAt,
        job: { id: r.get('j').properties.id, title: r.get('j').properties.title, salary: r.get('j').properties.salary, skills: r.get('skills') }
    }));

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS, message: 'History retrieved',
        data: { applications, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } }
    });
});

// Get applicants for a job
const getJobApplicants = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobCheck = await runQuery('MATCH (j:Job {id: $jobId}) RETURN j', { jobId }, 'READ');
    if (jobCheck.length === 0) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Job not found', ERROR_CODES.JOB_NOT_FOUND);

    const job = jobCheck[0].get('j').properties;
    if (req.user.role !== USER_ROLES.ADMIN && job.recruiterId !== req.user.id) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, 'Access denied', ERROR_CODES.USER_INVALID_ROLE);
    }

    const result = await runQuery(
        `MATCH (u:User)-[a:POSTULE_A]->(j:Job {id: $jobId})
         OPTIONAL MATCH (u)-[:POSSEDE]->(s:Skill)
         WITH u, a, COLLECT(DISTINCT s.name) AS skills
         RETURN u, a, skills ORDER BY a.appliedAt DESC SKIP $skip LIMIT $limit`,
        { jobId, skip: neo4j.int(skip), limit: neo4j.int(parseInt(limit)) }, 'READ'
    );

    const countResult = await runQuery('MATCH ()-[a:POSTULE_A]->(j:Job {id: $jobId}) RETURN COUNT(a) AS total', { jobId }, 'READ');
    const total = countResult[0].get('total');

    const applicants = result.map(r => ({
        application: { id: r.get('a').properties.id, status: r.get('a').properties.status, appliedAt: r.get('a').properties.appliedAt },
        candidate: { id: r.get('u').properties.id, name: r.get('u').properties.name, email: r.get('u').properties.email, skills: r.get('skills') }
    }));

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS, message: 'Applicants retrieved',
        data: { job: { id: job.id, title: job.title }, applicants, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } }
    });
});

// Update application status
const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    const appCheck = await runQuery(`MATCH (u:User)-[a:POSTULE_A {id: $applicationId}]->(j:Job) RETURN a, j`, { applicationId }, 'READ');
    if (appCheck.length === 0) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Application not found', ERROR_CODES.APPLICATION_NOT_FOUND);

    const job = appCheck[0].get('j').properties;
    if (req.user.role !== USER_ROLES.ADMIN && job.recruiterId !== req.user.id) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, 'Access denied', ERROR_CODES.USER_INVALID_ROLE);
    }

    const result = await runQuery(`MATCH ()-[a:POSTULE_A {id: $applicationId}]->(j:Job) SET a.status = $status, a.updatedAt = datetime() RETURN a, j`, { applicationId, status });
    const app = result[0].get('a').properties;

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS, message: 'Status updated',
        data: { application: { id: app.id, status: app.status } }
    });
});

// Withdraw application
const withdrawApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const appCheck = await runQuery(`MATCH (u:User {id: $userId})-[a:POSTULE_A {id: $applicationId}]->() RETURN a`, { userId: req.user.id, applicationId }, 'READ');
    if (appCheck.length === 0) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Application not found', ERROR_CODES.APPLICATION_NOT_FOUND);

    await runQuery(`MATCH (u:User {id: $userId})-[a:POSTULE_A {id: $applicationId}]->() DELETE a`, { userId: req.user.id, applicationId });
    res.status(STATUS_CODES.SUCCESS).json({ status: STATUS_CODES.SUCCESS, message: 'Application withdrawn' });
});

// Check application status
const checkApplicationStatus = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const result = await runQuery(`MATCH (u:User {id: $userId})-[a:POSTULE_A]->(j:Job {id: $jobId}) RETURN a`, { userId: req.user.id, jobId }, 'READ');

    if (result.length === 0) {
        return res.status(STATUS_CODES.SUCCESS).json({ status: STATUS_CODES.SUCCESS, data: { hasApplied: false, application: null } });
    }
    const app = result[0].get('a').properties;
    res.status(STATUS_CODES.SUCCESS).json({ status: STATUS_CODES.SUCCESS, data: { hasApplied: true, application: { id: app.id, status: app.status, appliedAt: app.appliedAt } } });
});

module.exports = { applyToJob, getApplicationHistory, getJobApplicants, updateApplicationStatus, withdrawApplication, checkApplicationStatus };
