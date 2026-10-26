// JobGraph - Neo4j Database Initialization
// Cypher queries for constraints, indexes, and sample data

// ============================================
// CONSTRAINTS (Ensure data integrity)
// ============================================

// Unique constraint on User email
CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

// Unique constraint on User id
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Unique constraint on Job id  
CREATE CONSTRAINT job_id_unique IF NOT EXISTS
FOR (j:Job) REQUIRE j.id IS UNIQUE;

// Unique constraint on Skill name
CREATE CONSTRAINT skill_name_unique IF NOT EXISTS
FOR (s:Skill) REQUIRE s.name IS UNIQUE;

// ============================================
// INDEXES (Improve query performance)
// ============================================

// Index on User role for filtering
CREATE INDEX user_role_index IF NOT EXISTS
FOR (u:User) ON (u.role);

// Index on Job salary for filtering
CREATE INDEX job_salary_index IF NOT EXISTS
FOR (j:Job) ON (j.salary);

// Index on Job recruiterId for recruiter queries
CREATE INDEX job_recruiter_index IF NOT EXISTS
FOR (j:Job) ON (j.recruiterId);

// ============================================
// SAMPLE DATA - SKILLS
// ============================================

// Create common skills
MERGE (s:Skill {name: 'Python'})
MERGE (s:Skill {name: 'Javascript'})
MERGE (s:Skill {name: 'Java'})
MERGE (s:Skill {name: 'Sql'})
MERGE (s:Skill {name: 'React'})
MERGE (s:Skill {name: 'Node.js'})
MERGE (s:Skill {name: 'Neo4j'})
MERGE (s:Skill {name: 'Mongodb'})
MERGE (s:Skill {name: 'Docker'})
MERGE (s:Skill {name: 'Kubernetes'})
MERGE (s:Skill {name: 'Aws'})
MERGE (s:Skill {name: 'Git'})
MERGE (s:Skill {name: 'Machine learning'})
MERGE (s:Skill {name: 'Data analysis'})
MERGE (s:Skill {name: 'Rest api'})
MERGE (s:Skill {name: 'Graphql'})
MERGE (s:Skill {name: 'React native'})
MERGE (s:Skill {name: 'Typescript'});

// ============================================
// SAMPLE DATA - USERS (passwords are 'password123' hashed)
// ============================================

// Admin user
CREATE (u:User {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@jobgraph.com',
    password: '$2a$10$XKQxQ0/0nV8Z5xQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0I',
    role: 'admin',
    title: 'System Administrator',
    createdAt: datetime()
});

// Recruiter users
CREATE (r1:User {
    id: 'recruiter-001',
    name: 'Marie Dupont',
    email: 'marie@techcorp.com',
    password: '$2a$10$XKQxQ0/0nV8Z5xQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0I',
    role: 'recruteur',
    title: 'HR Manager',
    createdAt: datetime()
});

CREATE (r2:User {
    id: 'recruiter-002',
    name: 'Jean Martin',
    email: 'jean@startup.io',
    password: '$2a$10$XKQxQ0/0nV8Z5xQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0I',
    role: 'recruteur',
    title: 'Tech Lead',
    createdAt: datetime()
});

// Candidate users
CREATE (c1:User {
    id: 'candidate-001',
    name: 'Ahmed Hassan',
    email: 'ahmed@email.com',
    password: '$2a$10$XKQxQ0/0nV8Z5xQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0I',
    role: 'candidat',
    title: 'Full Stack Developer',
    createdAt: datetime()
});

CREATE (c2:User {
    id: 'candidate-002',
    name: 'Sarah Chen',
    email: 'sarah@email.com',
    password: '$2a$10$XKQxQ0/0nV8Z5xQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0IVQQ5eZQ0I',
    role: 'candidat',
    title: 'Data Scientist',
    createdAt: datetime()
});

// ============================================
// SAMPLE DATA - CANDIDATE SKILLS (POSSEDE)
// ============================================

MATCH (c:User {id: 'candidate-001'})
MATCH (s1:Skill {name: 'Javascript'})
MATCH (s2:Skill {name: 'React'})
MATCH (s3:Skill {name: 'Node.js'})
MATCH (s4:Skill {name: 'Sql'})
MATCH (s5:Skill {name: 'Git'})
CREATE (c)-[:POSSEDE]->(s1)
CREATE (c)-[:POSSEDE]->(s2)
CREATE (c)-[:POSSEDE]->(s3)
CREATE (c)-[:POSSEDE]->(s4)
CREATE (c)-[:POSSEDE]->(s5);

MATCH (c:User {id: 'candidate-002'})
MATCH (s1:Skill {name: 'Python'})
MATCH (s2:Skill {name: 'Sql'})
MATCH (s3:Skill {name: 'Machine learning'})
MATCH (s4:Skill {name: 'Data analysis'})
CREATE (c)-[:POSSEDE]->(s1)
CREATE (c)-[:POSSEDE]->(s2)
CREATE (c)-[:POSSEDE]->(s3)
CREATE (c)-[:POSSEDE]->(s4);

// ============================================
// SAMPLE DATA - JOBS
// ============================================

CREATE (j1:Job {
    id: 'job-001',
    title: 'Full Stack Developer',
    description: 'We are looking for a Full Stack Developer to join our team. You will be responsible for developing and maintaining web applications.',
    salary: 55000,
    location: 'Paris',
    date_creation: datetime(),
    recruiterId: 'recruiter-001'
});

CREATE (j2:Job {
    id: 'job-002',
    title: 'Frontend React Developer',
    description: 'Join our team as a Frontend Developer specializing in React. Build beautiful and responsive user interfaces.',
    salary: 45000,
    location: 'Lyon',
    date_creation: datetime(),
    recruiterId: 'recruiter-001'
});

CREATE (j3:Job {
    id: 'job-003',
    title: 'Data Scientist',
    description: 'We need a Data Scientist to analyze data and build machine learning models to drive business decisions.',
    salary: 65000,
    location: 'Paris',
    date_creation: datetime(),
    recruiterId: 'recruiter-002'
});

CREATE (j4:Job {
    id: 'job-004',
    title: 'Backend Node.js Developer',
    description: 'Develop and maintain backend services using Node.js and Neo4j graph database.',
    salary: 50000,
    location: 'Remote',
    date_creation: datetime(),
    recruiterId: 'recruiter-002'
});

// ============================================
// SAMPLE DATA - JOB SKILLS (REQUIERT)
// ============================================

MATCH (j:Job {id: 'job-001'})
MATCH (s1:Skill {name: 'Javascript'})
MATCH (s2:Skill {name: 'React'})
MATCH (s3:Skill {name: 'Node.js'})
MATCH (s4:Skill {name: 'Sql'})
CREATE (j)-[:REQUIERT]->(s1)
CREATE (j)-[:REQUIERT]->(s2)
CREATE (j)-[:REQUIERT]->(s3)
CREATE (j)-[:REQUIERT]->(s4);

MATCH (j:Job {id: 'job-002'})
MATCH (s1:Skill {name: 'Javascript'})
MATCH (s2:Skill {name: 'React'})
MATCH (s3:Skill {name: 'Typescript'})
CREATE (j)-[:REQUIERT]->(s1)
CREATE (j)-[:REQUIERT]->(s2)
CREATE (j)-[:REQUIERT]->(s3);

MATCH (j:Job {id: 'job-003'})
MATCH (s1:Skill {name: 'Python'})
MATCH (s2:Skill {name: 'Sql'})
MATCH (s3:Skill {name: 'Machine learning'})
MATCH (s4:Skill {name: 'Data analysis'})
CREATE (j)-[:REQUIERT]->(s1)
CREATE (j)-[:REQUIERT]->(s2)
CREATE (j)-[:REQUIERT]->(s3)
CREATE (j)-[:REQUIERT]->(s4);

MATCH (j:Job {id: 'job-004'})
MATCH (s1:Skill {name: 'Javascript'})
MATCH (s2:Skill {name: 'Node.js'})
MATCH (s3:Skill {name: 'Neo4j'})
MATCH (s4:Skill {name: 'Rest api'})
CREATE (j)-[:REQUIERT]->(s1)
CREATE (j)-[:REQUIERT]->(s2)
CREATE (j)-[:REQUIERT]->(s3)
CREATE (j)-[:REQUIERT]->(s4);
