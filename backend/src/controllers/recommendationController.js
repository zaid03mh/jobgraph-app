/**
 * JobGraph - Recommendation Controller
 * 
 * Core recommendation engine that calculates relevance scores
 * between candidates and job offers based on skill matching.
 * 
 * Score Formula: matched_skills / required_skills
 */

const neo4j = require('neo4j-driver');
const { runQuery } = require('../config/database');
const { STATUS_CODES, ERROR_CODES, PAGINATION } = require('../config/constants');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get job recommendations for the current user
 * GET /api/recommendations
 * 
 * Calculates a relevance score for each job based on:
 * - User's skills (POSSEDE relationships)
 * - Job's required skills (REQUIERT relationships)
 * 
 * Score = (matched skills count) / (required skills count)
 * 
 * Returns jobs sorted by score in descending order,
 * along with an explanation of matched skills.
 * 
 * @query {number} [page] - Page number
 * @query {number} [limit] - Items per page
 * @query {number} [minScore] - Minimum score threshold (0-1)
 */
const getRecommendations = asyncHandler(async (req, res) => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        minScore = 0
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Main recommendation query using Cypher
    // This query:
    // 1. Gets all skills the user possesses
    // 2. For each job, gets all required skills
    // 3. Calculates intersection (matched skills)
    // 4. Computes score = matched / required
    // 5. Filters by minimum score
    // 6. Sorts by score descending
    const result = await runQuery(
        `// Get user's skills
         MATCH (user:User {id: $userId})-[:POSSEDE]->(userSkill:Skill)
         WITH user, COLLECT(userSkill.name) AS userSkills
         
         // For each job, get required skills
         MATCH (job:Job)-[:REQUIERT]->(reqSkill:Skill)
         WITH user, userSkills, job, COLLECT(reqSkill.name) AS requiredSkills
         
         // Calculate matched skills (intersection)
         WITH job, userSkills, requiredSkills,
              [skill IN requiredSkills WHERE skill IN userSkills] AS matchedSkills
         
         // Calculate score
         WITH job, 
              SIZE(matchedSkills) AS matchedCount,
              SIZE(requiredSkills) AS requiredCount,
              matchedSkills,
              requiredSkills
         
         // Only include jobs with at least one match
         WHERE matchedCount > 0
         
         // Calculate score as float
         WITH job, matchedSkills, requiredSkills,
              toFloat(matchedCount) / toFloat(requiredCount) AS score
         
         // Filter by minimum score
         WHERE score >= $minScore
         
         // Get recruiter info
         OPTIONAL MATCH (recruiter:User {id: job.recruiterId})
         
         // Check if user already applied
         OPTIONAL MATCH (applicant:User {id: $userId})-[app:POSTULE_A]->(job)
         
         RETURN job, 
                matchedSkills AS explanation, 
                requiredSkills,
                score,
                recruiter.name AS recruiterName,
                app IS NOT NULL AS hasApplied
         ORDER BY score DESC
         SKIP $skip LIMIT $limit`,
        {
            userId: req.user.id,
            minScore: parseFloat(minScore),
            skip: neo4j.int(skip),
            limit: neo4j.int(parseInt(limit))
        },
        'READ'
    );

    // Get total count for pagination
    const countResult = await runQuery(
        `MATCH (user:User {id: $userId})-[:POSSEDE]->(userSkill:Skill)
         WITH user, COLLECT(userSkill.name) AS userSkills
         MATCH (job:Job)-[:REQUIERT]->(reqSkill:Skill)
         WITH user, userSkills, job, COLLECT(reqSkill.name) AS requiredSkills
         WITH job, userSkills, requiredSkills,
              [skill IN requiredSkills WHERE skill IN userSkills] AS matchedSkills
         WITH job, SIZE(matchedSkills) AS matchedCount, SIZE(requiredSkills) AS requiredCount
         WHERE matchedCount > 0
         WITH job, toFloat(matchedCount) / toFloat(requiredCount) AS score
         WHERE score >= $minScore
         RETURN COUNT(job) AS total`,
        { userId: req.user.id, minScore: parseFloat(minScore) },
        'READ'
    );

    const total = countResult[0]?.get('total') || 0;

    // Format recommendations with explanations
    const recommendations = result.map(record => {
        const job = record.get('job').properties;
        const matchedSkills = record.get('explanation');
        const requiredSkills = record.get('requiredSkills');
        const score = record.get('score');

        // Generate human-readable explanation
        const explanation = matchedSkills.length > 0
            ? `Matched because of: ${matchedSkills.join(', ')}`
            : 'No skills matched';

        return {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                salary: job.salary,
                location: job.location,
                date_creation: job.date_creation,
                recruiterName: record.get('recruiterName')
            },
            recommendation: {
                score: Math.round(score * 100) / 100, // Round to 2 decimal places
                scorePercentage: Math.round(score * 100), // As percentage
                matchedSkills: matchedSkills,
                requiredSkills: requiredSkills,
                matchedCount: matchedSkills.length,
                requiredCount: requiredSkills.length,
                explanation: explanation
            },
            hasApplied: record.get('hasApplied')
        };
    });

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: recommendations.length > 0
            ? 'Recommendations retrieved successfully'
            : 'No job recommendations found. Try adding more skills to your profile.',
        data: {
            recommendations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

/**
 * Get recommendation score for a specific job
 * GET /api/recommendations/:jobId
 * 
 * Returns detailed matching analysis for a single job.
 */
const getJobRecommendation = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    // Check if job exists
    const jobCheck = await runQuery(
        'MATCH (j:Job {id: $jobId}) RETURN j',
        { jobId },
        'READ'
    );

    if (jobCheck.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'Job not found',
            ERROR_CODES.JOB_NOT_FOUND
        );
    }

    // Calculate recommendation for specific job
    const result = await runQuery(
        `MATCH (user:User {id: $userId})-[:POSSEDE]->(userSkill:Skill)
         WITH user, COLLECT(userSkill.name) AS userSkills
         MATCH (job:Job {id: $jobId})-[:REQUIERT]->(reqSkill:Skill)
         WITH user, userSkills, job, COLLECT(reqSkill.name) AS requiredSkills
         WITH job, userSkills, requiredSkills,
              [skill IN requiredSkills WHERE skill IN userSkills] AS matchedSkills,
              [skill IN requiredSkills WHERE NOT skill IN userSkills] AS missingSkills
         WITH job, matchedSkills, missingSkills, requiredSkills, userSkills,
              CASE WHEN SIZE(requiredSkills) > 0 
                   THEN toFloat(SIZE(matchedSkills)) / toFloat(SIZE(requiredSkills))
                   ELSE 0.0 END AS score
         OPTIONAL MATCH (recruiter:User {id: job.recruiterId})
         OPTIONAL MATCH (user)-[app:POSTULE_A]->(job) WHERE user.id = $userId
         RETURN job, matchedSkills, missingSkills, requiredSkills, userSkills, score,
                recruiter.name AS recruiterName, app IS NOT NULL AS hasApplied`,
        { userId: req.user.id, jobId },
        'READ'
    );

    if (result.length === 0) {
        // User has no skills, return job with 0 score
        const job = jobCheck[0].get('j').properties;
        return res.status(STATUS_CODES.SUCCESS).json({
            status: STATUS_CODES.SUCCESS,
            message: 'Add skills to your profile to see matching score',
            data: {
                job: { id: job.id, title: job.title, description: job.description, salary: job.salary },
                recommendation: { score: 0, matchedSkills: [], missingSkills: [], explanation: 'Add skills to see match' },
                hasApplied: false
            }
        });
    }

    const record = result[0];
    const job = record.get('job').properties;
    const matchedSkills = record.get('matchedSkills');
    const missingSkills = record.get('missingSkills');
    const score = record.get('score');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Recommendation calculated',
        data: {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                salary: job.salary,
                location: job.location,
                date_creation: job.date_creation,
                recruiterName: record.get('recruiterName')
            },
            recommendation: {
                score: Math.round(score * 100) / 100,
                scorePercentage: Math.round(score * 100),
                matchedSkills,
                missingSkills,
                requiredSkills: record.get('requiredSkills'),
                userSkills: record.get('userSkills'),
                explanation: matchedSkills.length > 0
                    ? `Matched: ${matchedSkills.join(', ')}`
                    : 'No matching skills'
            },
            hasApplied: record.get('hasApplied')
        }
    });
});

module.exports = { getRecommendations, getJobRecommendation };
