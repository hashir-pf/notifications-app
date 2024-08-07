const { ObjectId } = require('mongodb');
const Redis = require('redis');

// Redis client setup
const redisClient = Redis.createClient();
redisClient.connect();

// Function to get sources by workspace ID from MongoDB
async function getSourcesByWorkspaceFromDB(workspaceId, db) {
    try {
        if (!ObjectId.isValid(workspaceId)) {
            throw new Error('Invalid workspace ID');
        }

        const sources = await db.collection('sources').find({ workspace: new ObjectId(workspaceId) }).toArray();
        return sources;
    } catch (err) {
        throw new Error('Error fetching sources from database: ' + err.message);
    }
}

// Function to cache sources by workspace ID
const REDIS_KEY = 'sources_for_workspace';

async function cacheSourcesByWorkspace(workspaceId, db) {
    const sources = await getSourcesByWorkspaceFromDB(workspaceId, db);
    await redisClient.set(`${REDIS_KEY}:${workspaceId}`, JSON.stringify(sources), { EX: 3600 }); // Cache for 1 hour
    return sources;
}

// Function to get sources by workspace ID
async function getSourcesByWorkspace(workspaceId, db) {
    try {
        // Try to get sources from Redis
        const cachedSources = await redisClient.get(`${REDIS_KEY}:${workspaceId}`);
        if (cachedSources) {
            return JSON.parse(cachedSources);
        }
        
        // If not found in Redis, fetch from MongoDB and cache them
        return await cacheSourcesByWorkspace(workspaceId, db);
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

// Export the getSourcesByWorkspace function
module.exports = { getSourcesByWorkspace, cacheSourcesByWorkspace };
