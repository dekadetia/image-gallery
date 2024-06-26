// server.js or equivalent
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Event for image upload
    socket.on('imageUploaded', (data) => {
        io.emit('imageUploaded', data); // Broadcast to all clients
    });

    // Event for image deletion
    socket.on('imageDeleted', (data) => {
        io.emit('imageDeleted', data); // Broadcast to all clients
    });

    // Event for image update
    socket.on('imageUpdated', (data) => {
        io.emit('imageUpdated', data); // Broadcast to all clients
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
