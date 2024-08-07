// const { getSourcesByWorkspace } = require('../getSources');
const { ObjectId } = require('mongodb')

// async function getSources(workspaceId, db, res) {
//     try {
//         // Wait for getSourcesByWorkspace to resolve
//         const allSources = await getSourcesByWorkspace(workspaceId, db);
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ data: allSources }));
//     } catch (err) {
//         console.error('Failed to get sources:', err);
//         res.writeHead(500, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Failed to get sources' }));
//     }
// }

async function addSources(db, req, res, workspaceId) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const { name, type } = JSON.parse(body);

        try {
            if (!name || !type || !workspaceId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Name, type, and workspaceId are required' }));
                return;
            }

            const sources = db.collection('sources');
            // const newSource = {
            //     name,
            //     type,
            //     workspace: new ObjectId(workspaceId)
            // };

            // const result = await sources.insertOne(newSource);
            // newSource._id = result.insertedId
            res.writeHead(201, { 'Content-Type': 'application/json' });
            // res.end(JSON.stringify(newSource));
            res.end(JSON.stringify({name : "Hashir"}));
        } catch (err) {
            console.error('Failed to add source:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end('Failed to add source:', err);
        }
    });
}

async function updateSources(db, req, res, sourceId) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const { name, type } = JSON.parse(body);

        try {
            const sources = db.collection('sources');
            const oldSource = await sources.findOne({ _id: new ObjectId(sourceId) });
            let message = ''
            let updatedSource = {};
            
            if (name) {
                updatedSource.name = name
            }
            if (type) {
                updatedSource.type = type
            }
            const result = await sources.updateOne( { _id: new ObjectId(sourceId) }, { $set: updatedSource } );
            if (result.modifiedCount !== 0) {
                if (name === oldSource.name) {
                    message = `${name} (previously known as ${oldSource}) has been updated`
                } else {
                    message = `${name} has been updated`
                }
            } else {
                message = `${name} has been updated`
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message }));
        } catch (err) {
            console.error('Failed to add source:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to add source' }));
        }
    });
}

async function deleteSources(db, res, sourceId) {
    try {
        const sources = db.collection('sources');
        const result = await sources.findOne( { _id: new ObjectId(sourceId) } );
        if (result) {
            await sources.updateOne( { _id: new ObjectId(sourceId) }, { $set: { deleted: true } } );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Source not found' }));
        }
    } catch (err) {
        console.error('Failed to update source:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update source' }));
    }
}

module.exports = { addSources, updateSources, deleteSources };