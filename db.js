const { MongoClient } = require('mongodb');
const mongoURI = 'mongodb+srv://m-hashir-malik:1q2w3e4r5t6y@test.aii8c5e.mongodb.net/Test';

const connectToMongo = async () => {
    try {
        // Create a new MongoClient
        client = new MongoClient(mongoURI);
        
        // Connect to the MongoDB cluster
        await client.connect();

        console.log("Connected to MongoDB successfully");
        
        return client.db('Test');

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
};

module.exports = connectToMongo;
