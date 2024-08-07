const { MongoClient } = require('mongodb');
const  dotenv  = require('dotenv')
dotenv.config();

const connectToMongo = async () => {
    try {
        // Create a new MongoClient
        client = new MongoClient(process.env.MONGO_URI);
        
        // Connect to the MongoDB cluster
        await client.connect();

        console.log("Connected to MongoDB successfully");
        
        return client.db('Test');
        // return 'Connected to MongoDB successfully;

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
};

module.exports = connectToMongo;
