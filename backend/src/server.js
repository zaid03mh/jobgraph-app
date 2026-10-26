/**
 * JobGraph - Server Entry Point
 * Starts the Express server and verifies Neo4j connection
 */
const app = require('./app');
const { verifyConnection, closeConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
    try {
        // Verify Neo4j connection
        const connected = await verifyConnection();
        if (!connected) {
            console.error('Failed to connect to Neo4j. Please check your configuration.');
            process.exit(1);
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 JobGraph API Server`);
            console.log(`   Port: ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   API: http://localhost:${PORT}/api`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await closeConnection();
    process.exit(0);
});

startServer();
