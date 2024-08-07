const { MongoClient } = require('mongodb');
const mongoURI = 'mongodb+srv://hashirr:343713343713@cluster0.qgy3b.mongodb.net/';

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
