/**
 * JobGraph - Database Configuration
 * Neo4j Driver Setup and Session Management
 * 
 * This module establishes the connection to the Neo4j database
 * and provides helper functions for session management.
 */

const neo4j = require('neo4j-driver');
require('dotenv').config();

// Create the Neo4j driver instance
const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    ),
    {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
        disableLosslessIntegers: true // Convert Neo4j integers to JS numbers
    }
);

/**
 * Get a new database session
 * @param {string} mode - 'READ' or 'WRITE' (defaults to 'WRITE')
 * @returns {Session} Neo4j session object
 */
const getSession = (mode = 'WRITE') => {
    return driver.session({
        database: 'neo4j',
        defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE
    });
};

/**
 * Execute a Cypher query with automatic session management
 * @param {string} cypher - The Cypher query to execute
 * @param {object} params - Query parameters
 * @param {string} mode - 'READ' or 'WRITE'
 * @returns {Promise<Array>} Array of records
 */
const runQuery = async (cypher, params = {}, mode = 'WRITE') => {
    const session = getSession(mode);
    try {
        const result = await session.run(cypher, params);
        return result.records;
    } finally {
        await session.close();
    }
};

/**
 * Verify database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
const verifyConnection = async () => {
    const session = getSession('READ');
    try {
        await session.run('RETURN 1 AS result');
        console.log('✅ Neo4j connection established successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Neo4j:', error.message);
        return false;
    } finally {
        await session.close();
    }
};

/**
 * Close the driver connection (for graceful shutdown)
 */
const closeConnection = async () => {
    await driver.close();
    console.log('Neo4j connection closed');
};

module.exports = {
    driver,
    getSession,
    runQuery,
    verifyConnection,
    closeConnection
};
