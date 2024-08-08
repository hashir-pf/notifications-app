const { ObjectId } = require('mongodb');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectToMongo = require('./db');
const setupSourcesChangeStream = require('./changeStreams/sources');
const { addSources, updateSources, deleteSources } = require('./api/sources')
const fs = require('fs');
const url = require('url');
const port = 4000;
let db;


const server = http.createServer(async (req, res) => {
    // Handle CORS headers

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "1800");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" ); 
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Static file serving
    if (req.url === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end(`Error loading index.html: ${err}`);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<html><body><p>Hello World!</p></body></html>`);
            }
        });
    } else if (req.url.startsWith('/static/')) {
        const filePath = path.join(__dirname, 'react-chat/build', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': getContentType(req.url) });
                res.end(data);
            }
        });
    } else if (req.url.startsWith('/api/')) {
        await handleApiRequest(req, res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function getContentType(url) {
    if (url.endsWith('.js')) return 'application/javascript';
    if (url.endsWith('.css')) return 'text/css';
    if (url.endsWith('.ico')) return 'image/x-icon';
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
    if (url.endsWith('.svg')) return 'image/svg+xml';
    return 'text/plain';
}

const io = new Server(server, {
    cors: {
      origin: "http://localhost:5178/",
      allowedHeaders: ["Content-Type"]
    }
  });

const getUserById = async (collection, userId) => {
    try {
        console.log(userId)
        const user = await collection.findOne({ _id: new ObjectId(userId) });
        // console.log(user)
        return user;
    } catch (error) {
        console.error('Error retrieving user:', error);
        throw error;
    }
}

const handleApiRequest = async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const endpoint = parsedUrl.pathname.split('/').filter(Boolean);


    // #######################
    // #####   Sources   #####
    // #######################

    //  api/sources/getSources
    if (req.method === 'GET' && endpoint[0] === 'api' && endpoint[1] === 'sources' && endpoint[2] === 'getSources' && endpoint[3]) {
        // getSources(endpoint[3], db, res)
    }
    //  api/sources/addSources
    else if (req.method === 'POST' && endpoint[0] === 'api' && endpoint[1] === 'sources' && endpoint[2] === 'addSources' && endpoint[3]) {
        addSources(db, req, res, endpoint[3])
    } 
    //  api/sources/updateSources
    else if (req.method === 'PUT' && endpoint[0] === 'api' && endpoint[1] === 'sources' && endpoint[2] === 'updateSources' && endpoint[3]) {
        updateSources(db, req, res, endpoint[3])
    } 
    //  api/sources/deleteSources
    else if (req.method === 'GET' && endpoint[0] === 'api' && endpoint[1] === 'sources' && endpoint[2] === 'deleteSources' && endpoint[3]) {
        deleteSources(db, req, res, endpoint[3])
    } 
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
};

const main = async () => {
    db = await connectToMongo();
    let userID = []
    io.on('connection', (socket) => {
        socket.on('first_message', async (id) => {
            userID.push([socket, id])
            console.log('User connected');
            const usersCollection = db.collection('users');
            // const user = await getUserById(usersCollection, id);
            // if (user) {
            //     for (const room of user.workspaces) {
            //         let temp = room.toHexString();
            //         socket.join(temp);
            //         io.to(temp).emit('room', `${user.name} joined room: ${temp}`);
            //         console.log(`${user.name} joined room: ${temp}`);
            //     }
            // }
            getUserById(usersCollection, id).then(user => {
                if (user) {
                    for (const room of user.workspaces) {
                        let temp = room.toHexString();
                        socket.join(temp);
                        io.to(temp).emit('room', `${user.name} joined room: ${temp}`);
                        console.log(`${user.name} joined room: ${temp}`);
                    }
                }
            }).catch(err => {
                console.error('Error fetching user:', err);
            });
        });
        socket.on('chat message', (msg) => {
            console.log(`Message: ${msg}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    const emit = (workspace, message) =>{
        io.to(workspace).emit('room', message);
    }
    setupSourcesChangeStream(db, emit, userID).catch(err => {
        console.error('Error setting up MongoDB change stream:', err);
    });
};

// Call main function and start the server
main().catch(console.error);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
