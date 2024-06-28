// const express = require('express');
// const next = require('next');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors')


// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//     const server = express();
//     server.use(cors())

//     server.all('*', (req, res) => {
//         return handle(req, res);
//     });

//     const httpServer = http.createServer(server);
//     const io = new Server(httpServer, {
//         cors: {
//             origin: "https://localhost:3001",
//         }
//     });

//     io.on('connection', (socket) => {
//         console.log('a user connected');
//         socket.on('disconnect', () => {
//             console.log('user disconnected');
//         });

//         // Event for image upload
//         socket.on('image_uploaded', (data) => {
//             io.emit('image_uploaded', data); // Broadcast to all clients
//         });

//         // Event for image deletion
//         socket.on('image_deleted', () => {
//             io.emit('image_deleted'); // Broadcast to all clients
//         });

//         // Event for image update
//         socket.on('image_updated', (data) => {
//             io.emit('image_updated', data); // Broadcast to all clients
//         });
//     });

//     const PORT = process.env.PORT || 3001;
//     httpServer.listen(PORT, () => {
//         console.log(`Server is running on http://localhost:${PORT}`);
//     });

// }).catch((ex) => {
//     console.error(ex.stack);
//     process.exit(1);
// });


