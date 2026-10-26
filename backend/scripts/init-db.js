/**
 * JobGraph - Database Initialization Script
 * Run this script to set up constraints and sample data in Neo4j
 */
const { runQuery, verifyConnection, closeConnection } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const initDatabase = async () => {
    console.log('🔧 Initializing JobGraph Database...\n');

    try {
        // Verify connection
        const connected = await verifyConnection();
        if (!connected) {
            console.error('❌ Could not connect to Neo4j');
            process.exit(1);
        }

        // Create constraints
        console.log('📋 Creating constraints...');
        await runQuery('CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE');
        await runQuery('CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE');
        await runQuery('CREATE CONSTRAINT job_id_unique IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE');
        await runQuery('CREATE CONSTRAINT skill_name_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE');
        console.log('   ✓ Constraints created\n');

        // Create indexes
        console.log('📋 Creating indexes...');
        await runQuery('CREATE INDEX user_role_index IF NOT EXISTS FOR (u:User) ON (u.role)');
        await runQuery('CREATE INDEX job_salary_index IF NOT EXISTS FOR (j:Job) ON (j.salary)');
        console.log('   ✓ Indexes created\n');

        // Create skills
        console.log('📋 Creating skills...');
        const skills = ['Python', 'Javascript', 'Java', 'Sql', 'React', 'Node.js', 'Neo4j', 'Mongodb', 'Docker', 'Aws', 'Git', 'Machine learning', 'Data analysis', 'Rest api', 'React native', 'Typescript'];
        for (const skill of skills) {
            await runQuery('MERGE (s:Skill {name: $name})', { name: skill });
        }
        console.log(`   ✓ ${skills.length} skills created\n`);

        // Hash password for sample users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create admin
        console.log('📋 Creating users...');
        await runQuery(
            `MERGE (u:User {email: 'admin@jobgraph.com'})
             ON CREATE SET u.id = $id, u.name = 'Admin User', u.password = $password, u.role = 'admin', u.title = 'Administrator', u.createdAt = datetime()`,
            { id: uuidv4(), password: hashedPassword }
        );

        // Create recruiter
        await runQuery(
            `MERGE (u:User {email: 'recruiter@jobgraph.com'})
             ON CREATE SET u.id = $id, u.name = 'Marie Dupont', u.password = $password, u.role = 'recruteur', u.title = 'HR Manager', u.createdAt = datetime()`,
            { id: uuidv4(), password: hashedPassword }
        );

        // Create candidate
        const candidateId = uuidv4();
        await runQuery(
            `MERGE (u:User {email: 'candidate@jobgraph.com'})
             ON CREATE SET u.id = $id, u.name = 'Ahmed Hassan', u.password = $password, u.role = 'candidat', u.title = 'Developer', u.createdAt = datetime()`,
            { id: candidateId, password: hashedPassword }
        );

        // Add skills to candidate
        await runQuery(
            `MATCH (u:User {email: 'candidate@jobgraph.com'})
             MATCH (s:Skill) WHERE s.name IN ['Javascript', 'React', 'Node.js', 'Sql', 'Git']
             MERGE (u)-[:POSSEDE]->(s)`
        );
        console.log('   ✓ Users created\n');

        // Create jobs
        console.log('📋 Creating sample jobs...');
        const recruiterId = (await runQuery(`MATCH (u:User {email: 'recruiter@jobgraph.com'}) RETURN u.id AS id`, {}, 'READ'))[0].get('id');

        // Job 1
        await runQuery(
            `CREATE (j:Job {id: $id, title: 'Full Stack Developer', description: 'Looking for a Full Stack Developer to join our team.', salary: 55000, location: 'Paris', date_creation: datetime(), recruiterId: $recruiterId})`,
            { id: uuidv4(), recruiterId }
        );
        await runQuery(`MATCH (j:Job {title: 'Full Stack Developer'}), (s:Skill) WHERE s.name IN ['Javascript', 'React', 'Node.js', 'Sql'] MERGE (j)-[:REQUIERT]->(s)`);

        // Job 2
        await runQuery(
            `CREATE (j:Job {id: $id, title: 'Data Scientist', description: 'Analyze data and build ML models.', salary: 65000, location: 'Lyon', date_creation: datetime(), recruiterId: $recruiterId})`,
            { id: uuidv4(), recruiterId }
        );
        await runQuery(`MATCH (j:Job {title: 'Data Scientist'}), (s:Skill) WHERE s.name IN ['Python', 'Sql', 'Machine learning', 'Data analysis'] MERGE (j)-[:REQUIERT]->(s)`);

        // Job 3
        await runQuery(
            `CREATE (j:Job {id: $id, title: 'Backend Developer', description: 'Develop backend services with Node.js.', salary: 50000, location: 'Remote', date_creation: datetime(), recruiterId: $recruiterId})`,
            { id: uuidv4(), recruiterId }
        );
        await runQuery(`MATCH (j:Job {title: 'Backend Developer'}), (s:Skill) WHERE s.name IN ['Javascript', 'Node.js', 'Neo4j'] MERGE (j)-[:REQUIERT]->(s)`);

        console.log('   ✓ Jobs created\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Database initialized successfully!');
        console.log('\n📝 Test Accounts:');
        console.log('   Admin: admin@jobgraph.com / password123');
        console.log('   Recruiter: recruiter@jobgraph.com / password123');
        console.log('   Candidate: candidate@jobgraph.com / password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await closeConnection();
    }
};

initDatabase();
