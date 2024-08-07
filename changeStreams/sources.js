// const { cacheSourcesByWorkspace } = require('../getSources')
const { ObjectId } = require('mongodb');
// const Redis = require('redis');

// const redisClient = Redis.createClient();
// redisClient.connect();

const REDIS_KEY = 'sources_for_workspace';

// async function removeCacheForWorkspace(workspaceId) {
//     try {
//         const result = await redisClient.del(`${REDIS_KEY}:${workspaceId}`);
//         return result; // Returns the result of the deletion
//     } catch (err) {
//         console.error('Failed to remove cache:', err);
//         throw err;
//     }
// }

async function handleMongoDBChange(change, db, emit, userID) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'insert' || operationType === 'replace') {
        const workspaceId = fullDocument.workspace.toString();
        emit(fullDocument.workspace.toHexString(), `Source Added: ${fullDocument.name}`)
        let res = await db.collection('workspaces').findOne({ _id: new ObjectId(workspaceId) })
        // console.log(fullDocument)
        console.log(res)
        
        for (let user of res.users) {
            db.collection('unreadnotifications').insertOne({
                title: 'Source',
                description: `Source: ${fullDocument.name} has been added`,
                date: new Date(), // Use new Date() for the current date and time
                user_id: user
            })
            .then(result => {
                // Find the inserted document
                return db.collection('unreadnotifications').findOne({ _id: result.insertedId });
            })
            .then(result2 => {
                for (const [socket, user_id] of userID) {
                    if (JSON.stringify(new ObjectId(user_id)) === JSON.stringify(new ObjectId(user))) {
                        socket.emit('notification', result2)
                        break
                    }
                }
            })
            .catch(err => {
                console.error('Error processing user:', user, err);
            });
        }
        // await cacheSourcesByWorkspace(workspaceId, db);
    } else if (operationType === 'update') {
        if (!fullDocument.deleted) {
            const workspaceId = fullDocument.workspace.toString();
            console.log(fullDocument)
            // await cacheSourcesByWorkspace(workspaceId, db);
        }
        // soft delete
        else {
            let document = fullDocument;
            console.log(fullDocument)
            const result = await db.collection('sources').deleteOne({ _id: new ObjectId(document._id) });
            if (result.deletedCount === 1) {
                // await removeCacheForWorkspace(document.workspace.toString());
                console.log(`Source: ${document.name} has been deleted successfully`);
            } else {
                console.log('No documents matched the query. Deleted 0 documents.');
            }
        }
    } 
}

// Setup MongoDB change stream
async function setupSourcesChangeStream(db, emit, userID) {
    const collection = db.collection('sources');
    const changeStream = collection.watch([
        { $match: { $or: [{ operationType: 'insert' }, { operationType: 'update' }, { operationType: 'replace' }] } }
      ], { fullDocument: 'updateLookup' });
    changeStream.on('change', change => {
        handleMongoDBChange(change, db, emit, userID).catch(err => {
            console.error('Error handling MongoDB change:', err);
        });
    });
}

module.exports = setupSourcesChangeStream